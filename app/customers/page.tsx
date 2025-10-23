"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerCard } from "@/components/customer-card"
import { CustomerDialog } from "@/components/customer-dialog"
import { customersApi } from "@/lib/api"
import type { Customer } from "@/lib/types"
import { Plus, Search, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthGuard } from "@/components/auth-guard"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await customersApi.getAll()
      const uniqueCustomers = data.reduce((acc: Customer[], customer) => {
        const key = `${customer.name.toLowerCase()}-${customer.phone}-${customer.email?.toLowerCase() || ""}`
        const exists = acc.some((c) => `${c.name.toLowerCase()}-${c.phone}-${c.email?.toLowerCase() || ""}` === key)
        if (!exists) {
          acc.push(customer)
        }
        return acc
      }, [])
      setCustomers(uniqueCustomers)
    } catch (error) {
      console.error("[v0] Failed to load customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCustomer(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    await loadCustomers()
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await customersApi.delete(id)
      await loadCustomers()
    } catch (error) {
      console.error("[v0] Failed to delete customer:", error)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <AuthGuard allowedRoles={["owner"]}>
      <AppShell
        header={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
            <div>
              <h1 className="text-xl font-bold text-foreground">Customers</h1>
              <p className="text-sm text-muted-foreground">{customers.length} total customers</p>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex bg-transparent">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={handleCreate} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
            </Button>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-card border-border"
            />
          </div>

          {/* Customer Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-secondary p-6 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Add your first customer to get started"}
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Customer
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={() => handleEdit(customer)}
                  onDelete={() => handleDelete(customer.id)}
                />
              ))}
            </div>
          )}
        </div>

        <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editingCustomer} onSave={handleSave} />
      </AppShell>
    </AuthGuard>
  )
}
