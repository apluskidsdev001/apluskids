INSERT INTO kids_champ_whatsapp_preferences
    (participant_reference, status, source, reason, opted_in_at, opted_out_at, updated_by_user_id, updated_at)
SELECT gp.public_id,
       COALESCE(existing.status,
           CASE WHEN BOOL_OR(s.whatsapp_consent_at IS NOT NULL) THEN 'OPTED_IN' ELSE 'UNKNOWN' END),
       COALESCE(existing.source, 'SUBMISSION'),
       existing.reason,
       COALESCE(existing.opted_in_at, MIN(s.whatsapp_consent_at)),
       existing.opted_out_at,
       existing.updated_by_user_id,
       COALESCE(existing.updated_at, CURRENT_TIMESTAMP)
FROM kids_champ_guest_participants gp
JOIN kids_champ_guest_contacts gc ON gc.id = gp.guest_contact_id
LEFT JOIN kids_champ_whatsapp_preferences existing ON existing.participant_reference = gc.public_id
LEFT JOIN kids_champ_submissions s ON s.guest_participant_id = gp.id
GROUP BY gp.public_id, existing.status, existing.source, existing.reason,
         existing.opted_in_at, existing.opted_out_at, existing.updated_by_user_id, existing.updated_at
ON CONFLICT (participant_reference) DO NOTHING;

DELETE FROM kids_champ_whatsapp_preferences preference
USING kids_champ_guest_contacts contact
WHERE preference.participant_reference = contact.public_id;
