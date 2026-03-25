-- ===========================================
-- Yoyo Provider Mapping Setup Script
-- Run this in Supabase Dashboard → SQL Editor
-- ===========================================

-- Step 1: Find the yoyo provider account
-- (adjust the name filter if needed)
DO $$
DECLARE
  v_yoyo_account_id UUID;
  v_yoyo_provider_id TEXT;
  v_service_id UUID;
  v_bundle_item_id UUID;
  v_engagement_type TEXT;
  v_provider_service_id TEXT;
  v_service_name TEXT;
  v_priority INT;
BEGIN
  -- Find yoyo account
  SELECT id, provider_id, COALESCE(priority, 1)
  INTO v_yoyo_account_id, v_yoyo_provider_id, v_priority
  FROM provider_accounts
  WHERE LOWER(name) LIKE '%yoyo%' AND is_active = true
  LIMIT 1;

  IF v_yoyo_account_id IS NULL THEN
    RAISE EXCEPTION 'Yoyo provider account not found!';
  END IF;

  RAISE NOTICE 'Found yoyo account: % (provider_id: %)', v_yoyo_account_id, v_yoyo_provider_id;

  -- Service mappings: engagement_type => provider_service_id
  -- Views = 13636, Likes = 7515, Comments = 13362, Reposts = 13384, Shares = 10026, Saves = 11674
  
  DECLARE
    mappings TEXT[][] := ARRAY[
      ['views', '13636'],
      ['likes', '7515'],
      ['comments', '13362'],
      ['reposts', '13384'],
      ['shares', '10026'],
      ['saves', '11674']
    ];
    mapping TEXT[];
  BEGIN
    FOREACH mapping SLICE 1 IN ARRAY mappings LOOP
      v_engagement_type := mapping[1];
      v_provider_service_id := mapping[2];

      RAISE NOTICE 'Processing % => %', v_engagement_type, v_provider_service_id;

      -- Find or create the service
      SELECT id, name INTO v_service_id, v_service_name
      FROM services
      WHERE provider_id = v_yoyo_provider_id
        AND provider_service_id = v_provider_service_id
      LIMIT 1;

      IF v_service_id IS NULL THEN
        -- Create a placeholder service
        INSERT INTO services (
          provider_id, provider_service_id, name, category, 
          price, min_quantity, max_quantity, is_active
        ) VALUES (
          v_yoyo_provider_id, 
          v_provider_service_id,
          'Instagram ' || INITCAP(v_engagement_type) || ' (Yoyo #' || v_provider_service_id || ')',
          'Instagram ' || INITCAP(v_engagement_type),
          0, 10, 100000, true
        )
        RETURNING id INTO v_service_id;
        
        RAISE NOTICE '  Created service: % (id: %)', 'Instagram ' || INITCAP(v_engagement_type), v_service_id;
      ELSE
        RAISE NOTICE '  Service exists: % (id: %)', v_service_name, v_service_id;
      END IF;

      -- Find the bundle item for this engagement type
      SELECT bi.id INTO v_bundle_item_id
      FROM bundle_items bi
      JOIN engagement_bundles eb ON bi.bundle_id = eb.id
      WHERE bi.engagement_type = v_engagement_type
        AND eb.platform = 'instagram'
      LIMIT 1;

      IF v_bundle_item_id IS NOT NULL THEN
        -- Link service to bundle item
        UPDATE bundle_items
        SET service_id = v_service_id
        WHERE id = v_bundle_item_id AND (service_id IS NULL OR service_id != v_service_id);
        
        RAISE NOTICE '  Linked to bundle item: %', v_bundle_item_id;
      ELSE
        RAISE NOTICE '  WARNING: No bundle item found for %', v_engagement_type;
      END IF;

      -- Create or update service_provider_mapping
      INSERT INTO service_provider_mapping (
        service_id, provider_account_id, provider_service_id, sort_order, is_active
      ) VALUES (
        v_service_id, v_yoyo_account_id, v_provider_service_id, v_priority, true
      )
      ON CONFLICT (service_id, provider_account_id) 
      DO UPDATE SET 
        provider_service_id = EXCLUDED.provider_service_id,
        is_active = true;
      
      RAISE NOTICE '  ✅ Mapping set: % => % (yoyo)', v_engagement_type, v_provider_service_id;
    END LOOP;
  END;
END $$;

-- Verify the setup
SELECT 
  bi.engagement_type,
  s.name as service_name,
  s.provider_service_id,
  spm.provider_service_id as mapping_service_id,
  pa.name as account_name,
  spm.is_active
FROM bundle_items bi
JOIN engagement_bundles eb ON bi.bundle_id = eb.id
LEFT JOIN services s ON bi.service_id = s.id
LEFT JOIN service_provider_mapping spm ON s.id = spm.service_id
LEFT JOIN provider_accounts pa ON spm.provider_account_id = pa.id
WHERE eb.platform = 'instagram'
ORDER BY bi.engagement_type;
