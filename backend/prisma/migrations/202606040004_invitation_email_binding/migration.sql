-- Add optional invitee email binding for safer tenant invitations.
ALTER TABLE "Invitation" ADD COLUMN "inviteeEmail" TEXT;

CREATE INDEX "Invitation_inviteeEmail_idx" ON "Invitation"("inviteeEmail");
