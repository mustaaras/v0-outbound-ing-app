"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { bulkImportContactsAction } from "@/app/actions/contacts"
import { Card } from "@/components/ui/card"

interface ImportResult {
  email: string
  status: "success" | "failed"
  error?: string
}

export function ContactsImportDialog({ onImportComplete }: { onImportComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)
  const [importStats, setImportStats] = useState<{ imported: number; failed: number } | null>(null)
  const { toast } = useToast()

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/contact-import-template.csv'
    link.download = 'contact-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Parse rows
    const data: Array<Record<string, string>> = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
    
    return data
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))
      
      if (validTypes.includes(selectedFile.type) || hasValidExtension) {
        setFile(selectedFile)
        setImportResults(null)
        setImportStats(null)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        })
      }
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    
    try {
      const text = await file.text()
      const data = parseCSV(text)
      
      if (data.length === 0) {
        toast({
          title: "Empty File",
          description: "The file contains no data to import",
          variant: "destructive",
        })
        setIsImporting(false)
        return
      }

      // Map CSV columns to our contact format
      const contacts = data.map(row => {
        // Try to find email in various common column names
        const email = row.email || row['e-mail'] || row['email address'] || row.mail || ''
        
        // Try to find name fields
        const firstName = row['first name'] || row.firstname || row['first_name'] || row.name?.split(' ')[0] || ''
        const lastName = row['last name'] || row.lastname || row['last_name'] || row.name?.split(' ').slice(1).join(' ') || ''
        
        // Try to find company fields
        const companyName = row.company || row['company name'] || row.organization || row.org || 'Unknown Company'
        const companyDomain = row.domain || row['company domain'] || row.website?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`
        
        // Optional fields
        const title = row.title || row.position || row.role || row['job title'] || ''
        const companyIndustry = row.industry || row.sector || ''
        const companySize = row['company size'] || row.size || row.employees || ''
        const companyLocation = row.location || row.city || row.country || row.address || ''

        return {
          email,
          firstName,
          lastName,
          title,
          companyName,
          companyDomain,
          companyIndustry,
          companySize,
          companyLocation,
        }
      }).filter(contact => contact.email) // Only include contacts with email

      if (contacts.length === 0) {
        toast({
          title: "No Valid Contacts",
          description: "No contacts with valid email addresses found in the file",
          variant: "destructive",
        })
        setIsImporting(false)
        return
      }

      // Import contacts
      const result = await bulkImportContactsAction(contacts)
      
      if (result.success) {
        setImportStats({
          imported: result.imported,
          failed: result.failed,
        })
        setImportResults(result.results as ImportResult[] || [])
        
        toast({
          title: "Import Complete",
          description: `Successfully imported ${result.imported} contacts. ${result.failed} failed.`,
        })
        
        // Refresh the contacts list
        onImportComplete()
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import contacts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Error",
        description: "Failed to process the file",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFile(null)
    setImportResults(null)
    setImportStats(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your contacts. The file should include email addresses and optionally: first name, last name, company, title, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          {!importStats && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          )}

          {/* File Upload */}
          {!importStats && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV, XLS, or XLSX files (max 10MB)
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </Label>
              </div>

              {/* Expected Format */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2 text-sm">Expected CSV Format:</h4>
                <div className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                  <div>email,first name,last name,company,domain,title,industry,company size,location</div>
                  <div className="text-muted-foreground">john@example.com,John,Doe,Acme Inc,acme.com,CEO,Technology,50-200,San Francisco</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Only email is required. Other fields are optional. Column names are flexible.
                </p>
              </Card>

              {/* Import Button */}
              {file && (
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Contacts
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Import Results */}
          {importStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{importStats.imported}</p>
                      <p className="text-sm text-green-600">Imported</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importStats.failed}</p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Failed Imports Details */}
              {importResults && importResults.some(r => r.status === 'failed') && (
                <Card className="p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-medium mb-2 text-sm">Failed Imports:</h4>
                  <div className="space-y-1 text-xs">
                    {importResults
                      .filter(r => r.status === 'failed')
                      .map((result, index) => (
                        <div key={index} className="flex justify-between items-start gap-2 text-muted-foreground">
                          <span className="truncate">{result.email}</span>
                          <span className="text-red-600 text-right">{result.error}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
