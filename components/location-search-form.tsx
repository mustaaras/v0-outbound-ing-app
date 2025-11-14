"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Search, Building2, Globe, Crown, Send, Bookmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GooglePlace, LocationSearchParams, LocationSearchResult } from "@/lib/google-maps"
import { processLocationSearch, validateLocationSearchAccess } from "@/app/actions/location-search"
import { saveBuyer } from "@/app/actions/save-buyer"
import { devLog, errorLog } from "@/lib/logger"

// Extend window interface for Google Maps
declare global {
  interface Window {
    google: {
      maps: typeof google.maps
    }
  }
}

interface ProcessingResult {
  domains: string[]
  totalPlaces: number
  placesWithWebsites: number
  placesWithPhones: number
  places: GooglePlace[]
  scrapedEmails?: Array<{
    businessName: string
    website: string
    emails: string[]
    success: boolean
  }>
}

interface LocationSearchFormProps {
  isLoading?: boolean
  userId?: string
}

export function LocationSearchForm({ isLoading: externalLoading, userId }: LocationSearchFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [radius, setRadius] = useState("5000") // 5km default
  const [places, setPlaces] = useState<GooglePlace[]>([])
  const [processingResults, setProcessingResults] = useState<ProcessingResult | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [googleMaps, setGoogleMaps] = useState<typeof google.maps | null>(null)
  const [userAccess, setUserAccess] = useState<{
    canSearch: boolean
    tier: string
    remainingSearches?: number
  } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const locationInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const sendEmailToGenerator = useCallback((email: string, businessName: string) => {
    const params = new URLSearchParams({
      recipientEmail: email,
      recipientName: businessName,
      recipientCompany: businessName,
    })
    router.push(`/generator?${params.toString()}`)
  }, [router])

  const saveContact = useCallback(async (email: string, businessName: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await saveBuyer({
        userId,
        buyer: {
          email,
          first_name: null as any,
          last_name: null as any,
          company: businessName,
          title: "Business Contact",
        },
      })

      if (result.success) {
        toast({
          title: "Contact saved",
          description: `${email} has been added to your contacts.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Save failed",
          description: result.error || "Failed to save contact.",
          variant: "destructive",
        })
      }
    } catch (error) {
      errorLog("[v0] Error saving contact:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the contact.",
        variant: "destructive",
      })
    }
  }, [userId, toast])

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          throw new Error("Google Maps API key not configured")
        }

        // Load Google Maps API dynamically
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`
        script.async = true
        script.defer = true

        script.onload = () => {
          setGoogleMaps(window.google.maps)
          setMapsLoaded(true)
          devLog("[v0] Google Maps API loaded successfully")
        }

        script.onerror = (error) => {
          errorLog("[v0] Failed to load Google Maps API:", error)
          toast({
            title: "Error",
            description: "Failed to load Google Maps. Please check your API key configuration.",
            variant: "destructive",
          })
        }

        document.head.appendChild(script)
      } catch (error) {
        errorLog("[v0] Failed to load Google Maps API:", error)
        toast({
          title: "Error",
          description: "Failed to load Google Maps. Please check your API key configuration.",
          variant: "destructive",
        })
      }
    }

    loadGoogleMaps()
  }, [toast])

  // Check user access on mount (for future Snov.io integration)
  useEffect(() => {
    // Currently not needed without Snov.io
    // const checkAccess = async () => {
    //   try {
    //     const access = await validateLocationSearchAccess()
    //     setUserAccess(access)
    //   } catch (error) {
    //     errorLog("[v0] Failed to check user access:", error)
    //   }
    // }
    // checkAccess()
  }, [])

  const processPlaces = useCallback(async (foundPlaces: GooglePlace[]) => {
    if (!foundPlaces.length) return

    setIsLoading(true)
    try {
      const results = await processLocationSearch(foundPlaces)
      setProcessingResults(results)

      if (results.placesWithWebsites > 0 || results.placesWithPhones > 0) {
        toast({
          title: "Search completed!",
          description: `Found ${results.placesWithWebsites} businesses with websites and ${results.placesWithPhones} with phone numbers.`,
          variant: "default",
        })
      } else if (results.domains.length > 0) {
        toast({
          title: "Domains extracted",
          description: `Found ${results.domains.length} domains. ${results.placesWithWebsites} businesses have websites.`,
          variant: "default",
        })
      }
    } catch (error) {
      errorLog("[v0] Error processing places:", error)
      toast({
        title: "Processing failed",
        description: "Failed to process search results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (mapsLoaded && googleMaps && mapRef.current && !mapInstanceRef.current) {
      try {
        // Start with a world view - user can zoom in to their area of interest
        const defaultLocation = { lat: 20, lng: 0 } // Center of the world

        mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 2, // World view
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        devLog("[v0] Google Maps initialized")

        // Initialize autocomplete for location input
        if (locationInputRef.current) {
          autocompleteRef.current = new googleMaps.places.Autocomplete(locationInputRef.current, {
            types: ['(cities)'], // Restrict to cities for better UX
            fields: ['formatted_address', 'geometry', 'name']
          })

          // Listen for place selection
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            if (place && place.formatted_address) {
              setLocation(place.formatted_address)
              devLog("[v0] Location selected from autocomplete:", place.formatted_address)
            }
          })
        }
      } catch (error) {
        errorLog("[v0] Failed to initialize map:", error)
      }
    }
  }, [mapsLoaded, googleMaps])

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
  }, [])

  const addMarkersToMap = useCallback((places: GooglePlace[]) => {
    if (!googleMaps || !mapInstanceRef.current) return

    clearMarkers()

    const bounds = new googleMaps.LatLngBounds()

    places.forEach((place) => {
      if (place.location) {
        const marker = new googleMaps.Marker({
          position: place.location,
          map: mapInstanceRef.current!,
          title: place.name,
        })

        // Add info window
        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${place.name}</h3>
              ${place.formatted_address ? `<p style="margin: 0; font-size: 12px; color: #666;">${place.formatted_address}</p>` : ''}
              ${place.website ? `<p style="margin: 4px 0 0 0;"><a href="${place.website}" target="_blank" style="color: #007bff; text-decoration: none;">Visit Website</a></p>` : ''}
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current!, marker)
        })

        markersRef.current.push(marker)
        bounds.extend(place.location)
      }
    })

    // Fit map to show all markers
    if (places.length > 0) {
      mapInstanceRef.current!.fitBounds(bounds)
    }
  }, [googleMaps, clearMarkers])

  const searchPlaces = useCallback(async () => {
    if (!googleMaps || !mapsLoaded) {
      toast({
        title: "Error",
        description: "Google Maps is not loaded yet. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!searchQuery.trim() && !location.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query (e.g., 'restaurants') and/or location (e.g., 'New York, NY').",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const service = new googleMaps.places.PlacesService(document.createElement('div'))

      // Build search request
      let queryText = searchQuery.trim()

      // Include location in the query if provided
      if (location.trim()) {
        queryText = `${queryText} in ${location.trim()}`
      }

      const request: google.maps.places.TextSearchRequest = {
        query: queryText,
      }

      // Try to geocode the location for additional location bias
      if (location.trim()) {
        const geocoder = new googleMaps.Geocoder()
        const geocodeResult = await new Promise<google.maps.LatLng | null>((resolve) => {
          geocoder.geocode({ address: location.trim() }, (results, status) => {
            if (status === googleMaps.GeocoderStatus.OK && results && results[0]) {
              resolve(results[0].geometry.location)
            } else {
              resolve(null)
            }
          })
        })

        if (geocodeResult) {
          request.location = geocodeResult
          request.radius = parseInt(radius) || 5000

          // Update map center to the geocoded location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(geocodeResult)
            mapInstanceRef.current.setZoom(12)
          }
        } else {
          // If geocoding fails, still try the search with location in query
          devLog("[v0] Geocoding failed for location:", location.trim(), "but proceeding with query-based search")
        }
      }

      // Add business type filter
      if (businessType.trim()) {
        request.type = businessType.trim().toLowerCase()
      }

      devLog("[v0] Google Places search request:", request)

      const result = await new Promise<LocationSearchResult>((resolve) => {
        service.textSearch(request, async (results, status) => {
          if (status === googleMaps.places.PlacesServiceStatus.OK && results) {
            // Get detailed information for each place to ensure we have websites and phone numbers
            const detailedPlaces: GooglePlace[] = []

            // LIMIT: Maximum 10 places from Google Places API to avoid excessive API usage
            for (const result of results.slice(0, 10)) { // Limit to first 10 for performance
              try {
                // Get place details for complete information
                const details = await new Promise<google.maps.places.PlaceResult | null>((resolveDetails) => {
                  const detailRequest = {
                    placeId: result.place_id!,
                    fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'types', 'rating', 'user_ratings_total', 'price_level', 'business_status']
                  }
                  service.getDetails(detailRequest, (place, status) => {
                    if (status === googleMaps.places.PlacesServiceStatus.OK && place) {
                      resolveDetails(place)
                    } else {
                      resolveDetails(null)
                    }
                  })
                })

                if (details) {
                  detailedPlaces.push({
                    place_id: result.place_id!,
                    name: details.name || result.name!,
                    formatted_address: details.formatted_address || result.formatted_address,
                    formatted_phone_number: details.formatted_phone_number,
                    website: details.website,
                    types: details.types || result.types,
                    rating: details.rating || result.rating,
                    user_ratings_total: details.user_ratings_total || result.user_ratings_total,
                    price_level: details.price_level,
                    business_status: details.business_status,
                    vicinity: result.vicinity,
                    location: result.geometry?.location ? {
                      lat: result.geometry.location.lat(),
                      lng: result.geometry.location.lng(),
                    } : undefined,
                  })
                } else {
                  // Fallback to basic result if details fail
                  detailedPlaces.push({
                    place_id: result.place_id!,
                    name: result.name!,
                    formatted_address: result.formatted_address,
                    formatted_phone_number: result.formatted_phone_number,
                    website: result.website,
                    types: result.types,
                    rating: result.rating,
                    user_ratings_total: result.user_ratings_total,
                    price_level: result.price_level,
                    business_status: result.business_status,
                    vicinity: result.vicinity,
                    location: result.geometry?.location ? {
                      lat: result.geometry.location.lat(),
                      lng: result.geometry.location.lng(),
                    } : undefined,
                  })
                }
              } catch (error) {
                devLog(`[v0] Error getting details for place ${result.place_id}:`, error)
                // Still include basic result
                detailedPlaces.push({
                  place_id: result.place_id!,
                  name: result.name!,
                  formatted_address: result.formatted_address,
                  formatted_phone_number: result.formatted_phone_number,
                  website: result.website,
                  types: result.types,
                  rating: result.rating,
                  user_ratings_total: result.user_ratings_total,
                  price_level: result.price_level,
                  business_status: result.business_status,
                  vicinity: result.vicinity,
                  location: result.geometry?.location ? {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng(),
                  } : undefined,
                })
              }
            }

            resolve({
              places: detailedPlaces,
              status: status.toString(),
            })
          } else {
            resolve({
              places: [],
              status: status.toString(),
            })
          }
        })
      })

      devLog(`[v0] Google Places search returned ${result.places.length} results`)

      if (result.places.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms or location.",
          variant: "default",
        })
      } else {
        setPlaces(result.places)
        addMarkersToMap(result.places)

        // Process places for domain extraction and contact search
        processPlaces(result.places)

        toast({
          title: "Search completed",
          description: `Found ${result.places.length} business${result.places.length !== 1 ? 'es' : ''}.`,
          variant: "default",
        })
      }
    } catch (error) {
      errorLog("[v0] Google Places search error:", error)
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [googleMaps, mapsLoaded, searchQuery, location, businessType, radius, addMarkersToMap, processPlaces, toast])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchPlaces()
  }

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`)

        // Update map center
        if (mapInstanceRef.current && googleMaps) {
          const currentLocation = new googleMaps.LatLng(latitude, longitude)
          mapInstanceRef.current.setCenter(currentLocation)
          mapInstanceRef.current.setZoom(14)
        }

        setIsLoading(false)
        toast({
          title: "Location set",
          description: "Your current location has been set.",
          variant: "default",
        })
      },
      (error) => {
        errorLog("[v0] Geolocation error:", error)
        setIsLoading(false)
        toast({
          title: "Location error",
          description: "Unable to get your current location. Please enter it manually.",
          variant: "destructive",
        })
      }
    )
  }, [googleMaps, toast])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Business Search
          </CardTitle>
          <CardDescription>
            Find businesses in any city or location using Google Maps. Enter a search term like "restaurants" and select a location from the autocomplete dropdown to find businesses anywhere in the world.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchQuery">Search Query</Label>
                <Input
                  id="searchQuery"
                  placeholder="e.g., restaurants, coffee shops, dentists"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    ref={locationInputRef}
                    id="location"
                    placeholder="Start typing a city name (autocomplete available)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    title="Use current location"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type (Optional)</Label>
                <Input
                  id="businessType"
                  placeholder="e.g., restaurant, store, doctor"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Search Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="5000"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  min="100"
                  max="50000"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || externalLoading || !mapsLoaded}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Businesses
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Search Results Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg border"
            style={{ minHeight: "400px" }}
          />
          {!mapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {places.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Found {places.length} Business{places.length !== 1 ? 'es' : ''}
            </CardTitle>
            <CardDescription>
              {places.filter(p => p.website).length} have websites that can be processed for contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.slice(0, 9).map((place) => (
                <div key={place.place_id} className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold text-sm">{place.name}</h3>
                  {place.formatted_address && (
                    <p className="text-xs text-muted-foreground">{place.formatted_address}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {place.types?.slice(0, 2).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {place.website}
                    </a>
                  )}
                  {place.formatted_phone_number && (
                    <p className="text-xs text-green-600 font-medium">
                      📞 {place.formatted_phone_number}
                    </p>
                  )}
                  {place.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">⭐ {place.rating}</span>
                      {place.user_ratings_total && (
                        <span className="text-xs text-muted-foreground">
                          ({place.user_ratings_total})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {places.length > 9 && (
                <div className="p-4 border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  +{places.length - 9} more results...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Data Extracted
            </CardTitle>
            <CardDescription>
              Found {processingResults.placesWithWebsites} businesses with websites and {processingResults.placesWithPhones} with phone numbers from {processingResults.totalPlaces} total results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processingResults.scrapedEmails && processingResults.scrapedEmails.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">✨ Real Emails Found (Website Scraping)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processingResults.scrapedEmails.map((scraped, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {scraped.businessName}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          scraped.success
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {scraped.success ? '✅ Found' : '❌ Failed'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        🌐 {scraped.website}
                      </p>
                      {scraped.emails.length > 0 ? (
                        <div className="space-y-1">
                          {scraped.emails.map((email, emailIndex) => (
                            <div key={emailIndex} className="flex items-center justify-between">
                              <p className="text-xs font-mono text-green-700 dark:text-green-300 font-semibold">
                                📧 {email}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => sendEmailToGenerator(email, scraped.businessName)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => saveContact(email, scraped.businessName)}
                              >
                                <Bookmark className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No emails found on website
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  🎯 Real emails scraped from business websites! These are verified contact addresses.
                </p>
              </div>
            )}
            {processingResults.places && processingResults.places.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processingResults.places.slice(0, 20).map((place: GooglePlace) => (
                    <div key={place.place_id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{place.name}</h3>
                        {place.rating && (
                          <span className="text-xs text-muted-foreground">
                            ⭐ {place.rating}
                          </span>
                        )}
                      </div>
                      {place.formatted_address && (
                        <p className="text-xs text-muted-foreground">{place.formatted_address}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {place.types?.slice(0, 2).map((type: string) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline block"
                        >
                          🌐 {place.website}
                        </a>
                      )}
                      {place.formatted_phone_number && (
                        <p className="text-xs text-green-600 font-medium">
                          📞 {place.formatted_phone_number}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {processingResults.places.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{processingResults.places.length - 20} more businesses found
                  </p>
                )}
              </div>
            ) : processingResults.domains.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processingResults.domains.slice(0, 12).map((domain: string, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <p className="text-sm font-mono">{domain}</p>
                    </div>
                  ))}
                </div>
                {processingResults.domains.length > 12 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{processingResults.domains.length - 12} more domains found
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No business data could be extracted from the search results.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}