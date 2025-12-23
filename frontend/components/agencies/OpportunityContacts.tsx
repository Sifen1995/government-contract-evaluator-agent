'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GovernmentContact, Agency } from '@/types/agency'
import { getOpportunityContacts } from '@/lib/agencies'

interface OpportunityContactsProps {
  opportunityId: string;
  contractingOfficer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface ContactCardProps {
  title: string;
  contact?: GovernmentContact | null;
  fallbackName?: string;
  fallbackEmail?: string;
  fallbackPhone?: string;
}

function ContactCard({ title, contact, fallbackName, fallbackEmail, fallbackPhone }: ContactCardProps) {
  const [copied, setCopied] = useState(false)

  const name = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : fallbackName
  const email = contact?.email || fallbackEmail
  const phone = contact?.phone || fallbackPhone
  const hasContact = name || email || phone

  const handleCopyEmail = async () => {
    if (email) {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!hasContact) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <h4 className="font-medium text-gray-600">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">No contact available for this opportunity</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg border bg-white">
      <h4 className="font-medium text-gray-600 text-sm">{title}</h4>
      <div className="mt-2">
        {name && <p className="font-medium text-gray-900">{name}</p>}
        {contact?.title && <p className="text-sm text-gray-600">{contact.title}</p>}
        {email && (
          <div className="flex items-center gap-2 mt-2">
            <a
              href={`mailto:${email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {email}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyEmail}
              className="h-6 px-2 text-xs"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="text-sm text-gray-600 hover:text-gray-900 block mt-1"
          >
            {phone}
          </a>
        )}
      </div>
    </div>
  )
}

export function OpportunityContacts({ opportunityId, contractingOfficer }: OpportunityContactsProps) {
  const [contacts, setContacts] = useState<{
    contracting_officer?: GovernmentContact;
    osdbu_contact?: GovernmentContact;
    industry_liaison?: GovernmentContact;
    agency?: Agency;
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await getOpportunityContacts(opportunityId)
        setContacts(data)
      } catch (err) {
        // Silently fail - contacts are optional
        console.error('Error loading opportunity contacts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [opportunityId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Contacts</CardTitle>
          <CardDescription>Key contacts for this opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Contacts</CardTitle>
        <CardDescription>Key contacts for this opportunity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ContactCard
          title="Contracting Officer"
          contact={contacts?.contracting_officer}
          fallbackName={contractingOfficer?.name}
          fallbackEmail={contractingOfficer?.email}
          fallbackPhone={contractingOfficer?.phone}
        />

        <ContactCard
          title="Small Business Liaison (OSDBU)"
          contact={contacts?.osdbu_contact}
        />

        <ContactCard
          title="Industry Day Contact"
          contact={contacts?.industry_liaison}
        />

        {contacts?.agency?.small_business_url && (
          <div className="pt-2">
            <a
              href={contacts.agency.small_business_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View Agency Small Business Page
              <span>→</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
