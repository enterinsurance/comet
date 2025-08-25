import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const { token, signatureData, signerName, signerTitle, signerNotes } = await request.json();

    if (!token || !signatureData || !signerName) {
      return NextResponse.json(
        { error: 'Token, signature data, and signer name are required' },
        { status: 400 }
      );
    }

    // Validate token and get invitation
    const invitation = await prisma.documentInvitation.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid signing token' },
        { status: 404 }
      );
    }

    // Check if token is expired
    const now = new Date();
    if (invitation.expiresAt < now) {
      return NextResponse.json(
        { error: 'Signing link has expired' },
        { status: 400 }
      );
    }

    // Check if already completed
    if (invitation.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Document has already been signed' },
        { status: 400 }
      );
    }

    // Convert base64 signature to blob and upload
    const base64Data = signatureData.split(',')[1];
    const signatureBuffer = Buffer.from(base64Data, 'base64');
    
    const signatureBlobResult = await put(
      `signatures/${invitation.id}-${Date.now()}.png`,
      signatureBuffer,
      {
        contentType: 'image/png',
        access: 'public',
      }
    );

    // Update invitation with signature data
    const updatedInvitation = await prisma.documentInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'COMPLETED',
        signedAt: now,
        signatureUrl: signatureBlobResult.url,
        signerName: signerName.trim(),
        signerTitle: signerTitle?.trim() || null,
        signerNotes: signerNotes?.trim() || null,
        signerIpAddress: request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown',
        signerUserAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Check if all invitations for this document are completed
    const allInvitations = await prisma.documentInvitation.findMany({
      where: { documentId: invitation.documentId },
    });

    const allCompleted = allInvitations.every(inv => inv.status === 'COMPLETED');

    // If all signatures are collected, update document status
    if (allCompleted) {
      await prisma.document.update({
        where: { id: invitation.documentId },
        data: { status: 'COMPLETED' },
      });

      // TODO: Send completion notification emails to all parties
      // This will be implemented in Phase 6.2
    }

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      signatureUrl: signatureBlobResult.url,
      allSignaturesComplete: allCompleted,
    });

  } catch (error) {
    console.error('Signature submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit signature' },
      { status: 500 }
    );
  }
}