"use client"

import { useEffect, useState } from "react"
import { 
  getSavedContactsAction, 
  updateSavedContactAction, 
  deleteSavedContactAction, 
  addContactAction,
  searchContactsAction,
  saveContactAction 
} from "@/app/actions/contacts"
import type { UserContactView } from "@/lib/contacts-db-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Mail, Building2, CheckCircle2 } from "lucide-react"
import { ContactsImportDialog } from "@/components/contacts-import-dialog"

interface SearchResult {
  id: string
  email: string
  first_name?: string
  last_name?: string
  title?: string
  company_id?: string
  is_verified: boolean
  source?: string
  companies?: {
    id: string
    name: string
    domain: string
    industry?: string
    company_size?: string
    location?: string
  }
}

export default function ContactsList({ userTier }: { userTier: string }) {
  const [contacts, setContacts] = useState<UserContactView[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "contacted" | "replied" | "converted" | "unsubscribed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Database search states
  const [databaseSearchQuery, setDatabaseSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const { toast } = useToast()

  // Form state for adding new contact
  const [newContact, setNewContact] = useState({
    email: "",
    firstName: "",
    lastName: "",
    title: "",
    companyName: "",
    companyDomain: "",
    companyIndustry: "",
    companySize: "",
    companyLocation: "",
  })

  useEffect(() => {
    loadContacts()
  }, [filterStatus])

  async function loadContacts() {
    setLoading(true)
    try {
      const result = await getSavedContactsAction({
        status: filterStatus === "all" ? undefined : filterStatus,
      })

      if (result.success) {
        setContacts(result.contacts)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load contacts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSearchDatabase() {
    if (!databaseSearchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)
    
    try {
      // Check if it's an email, domain, or general search
      const isEmail = databaseSearchQuery.includes('@')
      const isDomain = databaseSearchQuery.includes('.') && !databaseSearchQuery.includes('@')
      
      const result = await searchContactsAction({
        email: isEmail ? databaseSearchQuery : undefined,
        domain: isDomain ? databaseSearchQuery : undefined,
        name: !isEmail && !isDomain ? databaseSearchQuery : undefined,
        limit: 50,
      })

      if (result.success) {
        setSearchResults(result.contacts as SearchResult[])
        if (result.contacts.length === 0) {
          toast({
            title: "No Results",
            description: "No contacts found matching your search",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to search contacts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching database:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSaveFromSearch(contact: SearchResult) {
    try {
      const result = await saveContactAction(contact.id, {
        status: "new",
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Contact added to your list",
        })
        loadContacts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save contact",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving contact:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()

    try {
      const result = await addContactAction({
        ...newContact,
        saveForUser: true,
        source: "manual",
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Contact added successfully",
        })
        setIsAddDialogOpen(false)
        setNewContact({
          email: "",
          firstName: "",
          lastName: "",
          title: "",
          companyName: "",
          companyDomain: "",
          companyIndustry: "",
          companySize: "",
          companyLocation: "",
        })
        loadContacts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add contact",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateStatus(contactId: string, newStatus: "new" | "contacted" | "replied" | "converted" | "unsubscribed") {
    try {
      const result = await updateSavedContactAction(contactId, {
        status: newStatus,
        last_contacted_at: newStatus === "contacted" ? new Date().toISOString() : undefined,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        })
        loadContacts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Are you sure you want to remove this contact?")) {
      return
    }

    try {
      const result = await deleteSavedContactAction(contactId)

      if (result.success) {
        toast({
          title: "Success",
          description: "Contact removed successfully",
        })
        loadContacts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove contact",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      contact.email?.toLowerCase().includes(query) ||
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.company_name?.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500"
      case "contacted":
        return "bg-yellow-500"
      case "replied":
        return "bg-purple-500"
      case "converted":
        return "bg-green-500"
      case "unsubscribed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Database Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Contact Database
          </CardTitle>
          <CardDescription>
            Search all contacts in the database and add them to your list
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, company, or domain..."
              value={databaseSearchQuery}
              onChange={(e) => setDatabaseSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchDatabase()
                }
              }}
            />
            <Button onClick={handleSearchDatabase} disabled={isSearching || !databaseSearchQuery.trim()}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Search Results ({searchResults.length})</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearchResults(false)
                    setSearchResults([])
                    setDatabaseSearchQuery("")
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="grid gap-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                {searchResults.map((result) => {
                  const isAlreadySaved = contacts.some(c => c.contact_id === result.id)
                  return (
                    <Card key={result.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">
                              {result.first_name || result.last_name
                                ? `${result.first_name || ''} ${result.last_name || ''}`.trim()
                                : 'Unknown Name'}
                            </p>
                            {result.is_verified && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {result.source && (
                              <Badge variant="secondary" className="text-xs">
                                {result.source}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <p className="truncate">{result.email}</p>
                          </div>
                          {result.title && (
                            <p className="text-sm text-muted-foreground truncate">{result.title}</p>
                          )}
                          {result.companies && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <p className="truncate">
                                {result.companies.name} • {result.companies.domain}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isAlreadySaved ? "outline" : "default"}
                          onClick={() => handleSaveFromSearch(result)}
                          disabled={isAlreadySaved}
                          className="shrink-0"
                        >
                          {isAlreadySaved ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Saved Contacts</CardTitle>
          <CardDescription>
            Manage your personal contact list ({contacts.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Input
              placeholder="Filter saved contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <div className="flex gap-2">
              <ContactsImportDialog onImportComplete={loadContacts} />
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Manually add a new contact to your database
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newContact.firstName}
                        onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newContact.lastName}
                        onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newContact.title}
                        onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Company Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          required
                          value={newContact.companyName}
                          onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyDomain">Company Domain *</Label>
                        <Input
                          id="companyDomain"
                          required
                          placeholder="example.com"
                          value={newContact.companyDomain}
                          onChange={(e) => setNewContact({ ...newContact, companyDomain: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyIndustry">Industry</Label>
                        <Input
                          id="companyIndustry"
                          value={newContact.companyIndustry}
                          onChange={(e) => setNewContact({ ...newContact, companyIndustry: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size</Label>
                        <Input
                          id="companySize"
                          placeholder="e.g., 50-200"
                          value={newContact.companySize}
                          onChange={(e) => setNewContact({ ...newContact, companySize: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="companyLocation">Location</Label>
                        <Input
                          id="companyLocation"
                          placeholder="e.g., San Francisco, CA"
                          value={newContact.companyLocation}
                          onChange={(e) => setNewContact({ ...newContact, companyLocation: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Contact</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="contacted">Contacted</TabsTrigger>
              <TabsTrigger value="replied">Replied</TabsTrigger>
              <TabsTrigger value="converted">Converted</TabsTrigger>
              <TabsTrigger value="unsubscribed">Unsubscribed</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Contacts List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No contacts found matching your search" : "No contacts yet. Search the database or add your first contact to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.saved_contact_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                        {contact.is_verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </p>
                        {contact.title && <p>{contact.title}</p>}
                        {contact.company_name && (
                          <p className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contact.company_name}
                            {contact.company_domain && ` • ${contact.company_domain}`}
                          </p>
                        )}
                        {contact.notes && (
                          <p className="text-xs italic mt-2">{contact.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={contact.status}
                        onChange={(e) => handleUpdateStatus(contact.saved_contact_id, e.target.value as any)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="replied">Replied</option>
                        <option value="converted">Converted</option>
                        <option value="unsubscribed">Unsubscribed</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.saved_contact_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
