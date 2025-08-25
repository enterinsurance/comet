# Signature Field Assignment Guide

This guide explains how to assign signature fields to specific signers in the Comet Document Signing platform.

## Prerequisites

Before you can assign fields, you need:
- A PDF document uploaded to the system
- Signature fields placed on the document
- Document prepared for signing (status: SENT)

## Steps to Assign Signature Fields

### 1. **Prepare Your Document First**
- Navigate to your document view page
- Go to the **"Edit Fields"** tab
- Add signature fields by clicking and dragging on the PDF where signatures are needed
- Switch to the **"Preview"** tab 
- Click **"Prepare for Signing"** to change document status from DRAFT to SENT

### 2. **Access the Signer Management Interface**
- Once document is prepared, the **"Send for Signing (SENT)"** tab will be enabled
- Click on the **"Send for Signing"** tab
- This opens the **InvitationManagement** component

### 3. **Add Signers**
- In the **"Manage Signers"** tab, you'll see the **"Add Signer"** section
- Enter the signer's **email address** (required)
- Optionally add their **full name**
- Optionally add a **default message** for all signers
- Click **"Add Signer"** to add them to the list

### 4. **Assign Fields to Signers**
There are **two ways** to assign fields:

#### Method A: From the Unassigned Fields Section
1. Scroll down to the **"Unassigned Fields"** section
2. For each field, you'll see a dropdown: **"Assign to signer..."**
3. Select the signer from the dropdown
4. The field will move to that signer's **"Assigned Fields"** list

#### Method B: Remove Field Assignments  
1. In the **Signers** list, find fields under **"Assigned Fields"**
2. Click the **"×"** button next to any field to unassign it
3. The field will move back to the **"Unassigned Fields"** section

### 5. **Review Assignment Summary**
- Check the summary cards showing:
  - **Signers**: Total number of signers added
  - **Total Fields**: All signature fields in document  
  - **Assigned**: Fields assigned to specific signers
  - **Unassigned**: Fields that any signer can sign

### 6. **Customize Messages (Optional)**
- Each signer has a **"Custom Message"** text area
- Add personalized messages for individual signers
- This overrides the global default message

### 7. **Send Invitations**
- Click **"Send Invitations (X)"** button
- Set expiration time (1-30 days, default 7 days)
- Review the confirmation dialog
- Click **"Send X Invitations"** to send emails

## Visual Indicators

- **Unassigned fields**: Gray dashed border, shown in "Unassigned Fields" section
- **Assigned fields**: Blue tags showing "Page X - Field" under each signer
- **Field count badges**: Each signer shows number of assigned fields
- **Warning**: Yellow alert if you have unassigned fields when sending

## Example Workflow

1. Document has 3 signature fields on pages 1 and 2
2. Add signer: `john@example.com` (John Doe)  
3. Add signer: `jane@example.com` (Jane Smith)
4. Assign Page 1 field to John Doe
5. Assign Page 2 fields to Jane Smith
6. Leave Page 1 second field unassigned (anyone can sign)
7. Send invitations with 7-day expiration

Each signer will receive an email with a unique signing URL and will only see their assigned fields when they open the document to sign.

## Tips

- **Unassigned fields** can be signed by any recipient who receives a signing URL
- **Assigned fields** are restricted to the specific signer they're assigned to
- You can **reassign fields** at any time before sending invitations
- **Custom messages** help provide context to each signer about what they're signing
- **Expiration dates** ensure signing requests don't remain open indefinitely

## Troubleshooting

### Document Status Issues
- If the "Send for Signing" tab is disabled, ensure your document status is "SENT"
- Documents must be prepared (validated) before you can assign fields

### Field Assignment Issues
- Fields must exist before they can be assigned
- Use the "Edit Fields" tab to add signature fields to your PDF
- Check the "Preview" tab to ensure fields are positioned correctly

### Email Issues
- Ensure RESEND_API_KEY is configured in your environment variables
- Check that recipient email addresses are valid
- Monitor the "Invitation Status" tab to track delivery and opens

## Next Steps

After sending invitations:
1. Monitor progress in the **"Invitation Status"** tab
2. Track who has viewed/signed the document
3. Receive notifications when signatures are completed
4. Download the final signed document when all signatures are collected