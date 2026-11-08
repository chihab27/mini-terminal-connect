-- Extend setup JSON acceptance only; no table changes or credential reads.
DO $migration$
DECLARE
 definition text;
 needle text := $old$'verification_path'))$old$;
 replacement text := $new$'verification_path','token_response_path','token_types','verification_method','verification_success'))$new$;
BEGIN
 definition := pg_get_functiondef('public.mt_save_oauth_setup(text,jsonb,text,text,boolean)'::regprocedure);
 IF strpos(definition,replacement)>0 THEN RETURN; END IF;
 IF strpos(definition,needle)=0 THEN
  RAISE EXCEPTION 'Unexpected mt_save_oauth_setup definition; inspect before applying template extension';
 END IF;
 EXECUTE replace(definition,needle,replacement);
END;
$migration$;
