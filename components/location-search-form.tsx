"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Search, Building2, Globe, Crown, Send, Bookmark, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GooglePlace, LocationSearchParams, LocationSearchResult } from "@/lib/google-maps"
import { processLocationSearch, validateLocationSearchAccess } from "@/app/actions/location-search"
import { scrapeWebsiteAction } from "@/app/actions/scrape-website"
import { addContactAction } from "@/app/actions/contacts"
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
  const [scrapedResults, setScrapedResults] = useState<Record<string, { loading?: boolean; emails?: string[]; success?: boolean; website?: string }>>({})
  const [isProcessingResults, setIsProcessingResults] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [googleMaps, setGoogleMaps] = useState<typeof google.maps | null>(null)
  const [savedContacts, setSavedContacts] = useState<Set<string>>(new Set())
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
    window.open(`/generator?${params.toString()}`, '_blank')
  }, [])

  const saveContact = useCallback(async (email: string, businessName: string) => {
    try {
      const result = await addContactAction({
        email,
        firstName: undefined,
        lastName: undefined,
        title: "Business Contact",
        companyName: businessName,
        companyDomain: businessName.toLowerCase().replace(/\s+/g, ''), // Simple domain extraction
        source: "location_search",
        saveForUser: true,
      })

      if (result.success) {
        setSavedContacts(prev => new Set(prev).add(email))
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
  }, [toast])

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

    setIsProcessingResults(true)
    setIsLoading(true)
    try {
      // We skip server-side website scraping here because the client will perform per-place scrapes
      const results = await processLocationSearch(foundPlaces, { scrapeWebsites: false })
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
      
      // Check if it's a limit error
      const errorMessage = error instanceof Error ? error.message : "Failed to process search results. Please try again."
      const isLimitError = errorMessage.includes("Monthly location search limit reached")
      
      if (isLimitError) {
        // Set state so the UI can show a persistent upgrade message
        setLimitError("You've used all 20 free searches this month. Upgrade to Light or Pro to continue searching.")
      }

      toast({
        title: isLimitError ? "Search Limit Reached" : "Processing failed",
        description: isLimitError 
          ? "You've used all 20 free searches this month. Upgrade to Light or Pro for unlimited searches!"
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessingResults(false)
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

            // LIMIT: Maximum 12 places from Google Places API to show more results
            for (const result of results.slice(0, 12)) { // Limit to first 12 for performance
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
  // Clear any previous limit error on a successful search
  setLimitError(null)
        addMarkersToMap(result.places)

        // Start per-place scraping asynchronously so each card updates as its scrape completes
        ;(async () => {
          const toScrape = result.places.slice(0, 12) // show first 12 results
          for (const place of toScrape) {
            // Initialize loading state for this place
            setScrapedResults(prev => ({ ...prev, [place.place_id]: { loading: true } }))

            if (place.website) {
              try {
                const res = await scrapeWebsiteAction(place.website)
                setScrapedResults(prev => ({
                  ...prev,
                  [place.place_id]: {
                    loading: false,
                    emails: res.emails || [],
                    success: res.success,
                    website: res.website,
                  }
                }))
              } catch (error) {
                setScrapedResults(prev => ({ ...prev, [place.place_id]: { loading: false, emails: [], success: false } }))
              }
            } else {
              // No website to scrape
              setScrapedResults(prev => ({ ...prev, [place.place_id]: { loading: false, emails: [], success: false } }))
            }

            // Small delay to avoid hammering target sites
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        })()

        // Process places for domain extraction and contact search (skip website scraping server-side)
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
                  <div className="relative flex-1">
                    <Input
                      ref={locationInputRef}
                      id="location"
                      placeholder={mapsLoaded ? "Start typing a city name (autocomplete available)" : "Loading city autocomplete..."}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!mapsLoaded}
                    />
                    {!mapsLoaded && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
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

      <div className="text-xs text-muted-foreground mt-2">
        please note: website scraping is currently in beta and may not find every contact. please manually verify any email addresses on the target website before outreach.
      </div>

        {/* If user hit free tier limit, show a persistent upgrade message */}
        {limitError && (
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Crown className="h-4 w-4 text-red-700" />
                Search Limit Reached
              </CardTitle>
              <CardDescription className="text-red-700">
                {limitError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button onClick={() => router.push('/upgrade')} className="bg-red-600 text-white hover:bg-red-700">Upgrade Account</Button>
                <Button variant="outline" onClick={() => setLimitError(null)}>Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Visible Map - keep the map so autocomplete and map interactions are available */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map View
          </CardTitle>
          <CardDescription>
            Interactive map showing search results. You can click markers to view business details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-64 rounded-md overflow-hidden" />
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
              {places.slice(0, 12).map((place) => (
                <div key={place.place_id} className="p-4 border rounded-lg space-y-0.5">
                    <h3 className="font-semibold text-xs mb-0">{place.name}</h3>
                    {place.formatted_address && (
                      <p className="text-xs text-muted-foreground">{place.formatted_address}</p>
                    )}
                    <div className="flex flex-wrap gap-0.5 items-center -mt-1">
                      {place.types?.slice(0, 2).map((type) => (
                        <Badge key={type} variant="secondary" className="text-[10px] px-1 py-0.5">
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
                  {/* Inline scraping results for this place (populate progressively) */}
                  <div>
                            {scrapedResults[place.place_id]?.loading ? (
                              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Scraping website for emails...
                              </div>
                            ) : scrapedResults[place.place_id] && scrapedResults[place.place_id].emails && scrapedResults[place.place_id].emails!.length > 0 ? (
                              (() => {
                                const primary = scrapedResults[place.place_id].emails![0]
                                return (
                                  <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-900/30">
                                    <div className="text-xs font-medium text-green-800 truncate">{primary}</div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-sm" onClick={() => sendEmailToGenerator(primary, place.name)}>
                                        <Send className="h-3 w-3 mr-1" />
                                        Send
                                      </Button>
                                      <Button size="sm" variant={savedContacts.has(primary) ? "default" : "outline"} className="h-7 px-2 text-sm" onClick={() => saveContact(primary, place.name)} disabled={savedContacts.has(primary)}>
                                        {savedContacts.has(primary) ? (
                                          <>
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Saved
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark className="h-3 w-3 mr-1" />
                                            Save
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })()
                            ) : scrapedResults[place.place_id] && scrapedResults[place.place_id].emails && scrapedResults[place.place_id].emails!.length === 0 ? (
                              <p className="mt-2 text-xs text-muted-foreground italic">No emails found on website</p>
                            ) : (
                              place.website ? (
                                <p className="mt-2 text-xs text-muted-foreground italic">Ready to scrape</p>
                              ) : (
                                <p className="mt-2 text-xs text-muted-foreground italic">No website to scrape</p>
                              )
                            )}
                  </div>
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
              {places.length > 12 && (
                <div className="p-4 border rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  +{places.length - 12} more results...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing results UI removed — we now show per-card incremental results */}
    </div>
  )
}