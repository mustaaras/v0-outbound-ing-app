"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  getSavedContactsAction, 
  updateSavedContactAction, 
  deleteSavedContactAction, 
  addContactAction,
  updateContactAction,
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
import { Plus, Mail, Building2, Send, CheckCircle2, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { ContactsImportDialog } from "@/components/contacts-import-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContactsList({ userTier }: { userTier: string }) {
  const [contacts, setContacts] = useState<UserContactView[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "contacted" | "replied" | "converted" | "unsubscribed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<UserContactView | null>(null)
  const [totalContacts, setTotalContacts] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  const { toast } = useToast()
  const router = useRouter()

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
  }, [filterStatus, pageSize, currentPage])

  async function loadContacts() {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const result = await getSavedContactsAction({
        status: filterStatus === "all" ? undefined : filterStatus,
        limit: pageSize,
        offset: offset,
      })

      if (result.success) {
        setContacts(result.contacts)
        setTotalContacts(result.total)
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

  async function handleEditContact(e: React.FormEvent) {
    e.preventDefault()
    if (!editingContact) return

    try {
      const result = await updateContactAction(editingContact.contact_id, {
        first_name: editingContact.first_name,
        last_name: editingContact.last_name,
        title: editingContact.title,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Contact updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingContact(null)
        loadContacts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update contact",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating contact:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  function handleEditClick(contact: UserContactView) {
    setEditingContact(contact)
    setIsEditDialogOpen(true)
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

  function handleSendEmail(contact: UserContactView) {
    // Navigate to generator with pre-filled contact info
    const params = new URLSearchParams({
      recipientEmail: contact.email,
      recipientName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email.split('@')[0],
      recipientCompany: contact.company_name || '',
      recipientTitle: contact.title || '',
    })
    
    router.push(`/generator?${params.toString()}`)
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
      {/* My Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Saved Contacts</CardTitle>
          <CardDescription>
            Manage your personal contact list ({totalContacts} total)
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
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={newContact.companyName}
                            onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyDomain">Company Domain</Label>
                          <Input
                            id="companyDomain"
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

          {/* Edit Contact Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
                <DialogDescription>
                  Update contact information
                </DialogDescription>
              </DialogHeader>
              {editingContact && (
                <form onSubmit={handleEditContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editingContact.first_name || ""}
                        onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editingContact.last_name || ""}
                        onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editingContact.title || ""}
                        onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Contact</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value: string) => {
                setPageSize(parseInt(value))
                setCurrentPage(1) // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalContacts > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalContacts)} of ${totalContacts}` : '0 contacts'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= totalContacts || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

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
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendEmail(contact)}
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Email
                      </Button>
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
                        onClick={() => handleEditClick(contact)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
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
