create type "public"."appointment_mode" as enum ('in_person', 'virtual');

create type "public"."appointment_status" as enum ('requested', 'scheduled', 'completed', 'cancelled', 'no_show');

create type "public"."cancellation_reason" as enum ('owner_request', 'clinic_emergency', 'weather', 'no_veterinarian_available', 'pet_health_issue', 'other');

create type "public"."check_in_status" as enum ('checked_in', 'in_progress', 'completed');

create type "public"."owner_relationship" as enum ('owner', 'co_owner', 'family', 'caretaker');

create type "public"."pet_sex" as enum ('male', 'female', 'unknown');

create type "public"."pet_species" as enum ('dog', 'cat', 'bird', 'rabbit', 'reptile', 'other');

create type "public"."reschedule_reason" as enum ('owner_request', 'veterinarian_unavailable', 'clinic_schedule_conflict', 'equipment_issue', 'pet_health_issue', 'other');

create type "public"."schedule_status" as enum ('active', 'inactive');

create type "public"."user_role" as enum ('admin', 'veterinarian', 'owner');


  create table "public"."appointment_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "day_of_week" integer not null,
    "start_time" time with time zone not null,
    "end_time" time with time zone not null,
    "max_capacity" integer not null default 3,
    "current_bookings" integer not null default 0,
    "status" public.schedule_status not null default 'active'::public.schedule_status,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "specific_date" date,
    "is_recurring" boolean default true,
    "is_closed" boolean default false
      );


alter table "public"."appointment_schedules" enable row level security;


  create table "public"."appointment_status_history" (
    "id" uuid not null default gen_random_uuid(),
    "appointment_id" uuid not null,
    "previous_status" public.appointment_status,
    "new_status" public.appointment_status not null,
    "changed_by_id" uuid,
    "reason" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."appointment_status_history" enable row level security;


  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "pet_id" uuid not null,
    "owner_id" uuid not null,
    "service_id" uuid,
    "status" public.appointment_status not null default 'requested'::public.appointment_status,
    "mode" public.appointment_mode not null default 'in_person'::public.appointment_mode,
    "reason" text,
    "notes" text,
    "preferred_date" date,
    "preferred_time" text,
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "assigned_veterinarian_id" uuid,
    "requested_at" timestamp with time zone not null default now(),
    "confirmed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" public.cancellation_reason,
    "rescheduled_from" uuid,
    "no_show_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."appointments" enable row level security;


  create table "public"."check_ins" (
    "id" uuid not null default gen_random_uuid(),
    "appointment_id" uuid,
    "pet_id" uuid,
    "owner_id" uuid,
    "status" public.check_in_status not null default 'checked_in'::public.check_in_status,
    "walk_in" boolean not null default false,
    "arrival_time" timestamp with time zone not null default now(),
    "service_start" timestamp with time zone,
    "service_end" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."check_ins" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "type" text not null,
    "title" text not null,
    "body" text,
    "link" text,
    "is_read" boolean not null default false,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."pet_owners" (
    "id" uuid not null default gen_random_uuid(),
    "pet_id" uuid not null,
    "owner_profile_id" uuid not null,
    "relationship" public.owner_relationship not null default 'owner'::public.owner_relationship,
    "is_primary_contact" boolean not null default false,
    "can_view_medical_records" boolean not null default true,
    "can_receive_notifications" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."pet_owners" enable row level security;


  create table "public"."pets" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "species" public.pet_species not null,
    "breed" text,
    "sex" public.pet_sex not null default 'unknown'::public.pet_sex,
    "date_of_birth" date,
    "age" integer,
    "color" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "species_detail" text
      );


alter table "public"."pets" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "role" public.user_role default 'owner'::public.user_role,
    "full_name" text,
    "phone" text,
    "address" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "is_active" boolean not null default true
      );


alter table "public"."profiles" enable row level security;


  create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "short_desc" text,
    "category" text,
    "price_from" numeric(10,2),
    "price_to" numeric(10,2),
    "price_label" text,
    "duration_minutes" integer,
    "is_featured" boolean default false,
    "is_published" boolean default true,
    "display_order" integer default 0,
    "icon" text,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."services" enable row level security;


  create table "public"."staff_audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "actor_id" uuid not null,
    "target_profile_id" uuid not null,
    "action" text not null,
    "previous_values" jsonb,
    "next_values" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."staff_audit_logs" enable row level security;

CREATE UNIQUE INDEX appointment_schedules_pkey ON public.appointment_schedules USING btree (id);

CREATE UNIQUE INDEX appointment_status_history_pkey ON public.appointment_status_history USING btree (id);

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX check_ins_pkey ON public.check_ins USING btree (id);

CREATE INDEX idx_appointment_schedules_day ON public.appointment_schedules USING btree (day_of_week);

CREATE INDEX idx_appointment_schedules_status ON public.appointment_schedules USING btree (status);

CREATE INDEX idx_appointment_status_history_appointment_id ON public.appointment_status_history USING btree (appointment_id);

CREATE INDEX idx_appointment_status_history_created_at ON public.appointment_status_history USING btree (created_at);

CREATE INDEX idx_appointments_assigned_veterinarian_id ON public.appointments USING btree (assigned_veterinarian_id);

CREATE INDEX idx_appointments_owner_id ON public.appointments USING btree (owner_id);

CREATE INDEX idx_appointments_pet_id ON public.appointments USING btree (pet_id);

CREATE INDEX idx_appointments_scheduled_start ON public.appointments USING btree (scheduled_start);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_check_ins_appointment_id ON public.check_ins USING btree (appointment_id);

CREATE INDEX idx_check_ins_arrival_time ON public.check_ins USING btree (arrival_time);

CREATE INDEX idx_check_ins_owner_id ON public.check_ins USING btree (owner_id);

CREATE INDEX idx_check_ins_pet_id ON public.check_ins USING btree (pet_id);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_pet_owners_owner_profile_id ON public.pet_owners USING btree (owner_profile_id);

CREATE INDEX idx_pet_owners_pet_id ON public.pet_owners USING btree (pet_id);

CREATE INDEX idx_pets_name ON public.pets USING btree (name);

CREATE INDEX idx_pets_species ON public.pets USING btree (species);

CREATE INDEX idx_services_is_published ON public.services USING btree (is_published);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX pet_owners_pkey ON public.pet_owners USING btree (id);

CREATE UNIQUE INDEX pets_pkey ON public.pets USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX services_slug_idx ON public.services USING btree (slug);

CREATE INDEX staff_audit_logs_created_at_idx ON public.staff_audit_logs USING btree (created_at);

CREATE UNIQUE INDEX staff_audit_logs_pkey ON public.staff_audit_logs USING btree (id);

CREATE INDEX staff_audit_logs_target_profile_id_idx ON public.staff_audit_logs USING btree (target_profile_id);

CREATE UNIQUE INDEX unique_pet_owner ON public.pet_owners USING btree (pet_id, owner_profile_id);

alter table "public"."appointment_schedules" add constraint "appointment_schedules_pkey" PRIMARY KEY using index "appointment_schedules_pkey";

alter table "public"."appointment_status_history" add constraint "appointment_status_history_pkey" PRIMARY KEY using index "appointment_status_history_pkey";

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."check_ins" add constraint "check_ins_pkey" PRIMARY KEY using index "check_ins_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."pet_owners" add constraint "pet_owners_pkey" PRIMARY KEY using index "pet_owners_pkey";

alter table "public"."pets" add constraint "pets_pkey" PRIMARY KEY using index "pets_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."staff_audit_logs" add constraint "staff_audit_logs_pkey" PRIMARY KEY using index "staff_audit_logs_pkey";

alter table "public"."appointment_schedules" add constraint "appointment_schedules_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."appointment_schedules" validate constraint "appointment_schedules_day_of_week_check";

alter table "public"."appointment_status_history" add constraint "appointment_status_history_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE not valid;

alter table "public"."appointment_status_history" validate constraint "appointment_status_history_appointment_id_fkey";

alter table "public"."appointment_status_history" add constraint "appointment_status_history_changed_by_id_fkey" FOREIGN KEY (changed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."appointment_status_history" validate constraint "appointment_status_history_changed_by_id_fkey";

alter table "public"."appointments" add constraint "appointments_assigned_veterinarian_id_fkey" FOREIGN KEY (assigned_veterinarian_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_assigned_veterinarian_id_fkey";

alter table "public"."appointments" add constraint "appointments_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."appointments" validate constraint "appointments_owner_id_fkey";

alter table "public"."appointments" add constraint "appointments_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_pet_id_fkey";

alter table "public"."appointments" add constraint "appointments_rescheduled_from_fkey" FOREIGN KEY (rescheduled_from) REFERENCES public.appointments(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_rescheduled_from_fkey";

alter table "public"."appointments" add constraint "appointments_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_service_id_fkey";

alter table "public"."check_ins" add constraint "check_ins_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL not valid;

alter table "public"."check_ins" validate constraint "check_ins_appointment_id_fkey";

alter table "public"."check_ins" add constraint "check_ins_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."check_ins" validate constraint "check_ins_owner_id_fkey";

alter table "public"."check_ins" add constraint "check_ins_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL not valid;

alter table "public"."check_ins" validate constraint "check_ins_pet_id_fkey";

alter table "public"."pet_owners" add constraint "pet_owners_owner_profile_id_fkey" FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."pet_owners" validate constraint "pet_owners_owner_profile_id_fkey";

alter table "public"."pet_owners" add constraint "pet_owners_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE not valid;

alter table "public"."pet_owners" validate constraint "pet_owners_pet_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_auth_users_id_fk" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_auth_users_id_fk";

alter table "public"."staff_audit_logs" add constraint "staff_audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."staff_audit_logs" validate constraint "staff_audit_logs_actor_id_fkey";

alter table "public"."staff_audit_logs" add constraint "staff_audit_logs_target_profile_id_fkey" FOREIGN KEY (target_profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."staff_audit_logs" validate constraint "staff_audit_logs_target_profile_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_double_booking(p_veterinarian_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE assigned_veterinarian_id = p_veterinarian_id
    AND status IN ('requested', 'scheduled')
    AND scheduled_start IS NOT NULL
    AND scheduled_end IS NOT NULL
    AND scheduled_start < p_end
    AND scheduled_end > p_start
    AND (p_exclude_appointment_id IS NULL OR id <> p_exclude_appointment_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.create_owned_pet(p_name text, p_species public.pet_species, p_species_detail text DEFAULT NULL::text, p_breed text DEFAULT NULL::text, p_sex public.pet_sex DEFAULT 'unknown'::public.pet_sex, p_date_of_birth date DEFAULT NULL::date, p_age integer DEFAULT NULL::integer, p_color text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS public.pets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_pet public.pets;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT private.is_owner()) THEN
    RAISE EXCEPTION 'Only active owners can add pets';
  END IF;

  IF btrim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'A pet name is required';
  END IF;

  IF p_species = 'other' AND btrim(coalesce(p_species_detail, '')) = '' THEN
    RAISE EXCEPTION 'Please specify the species';
  END IF;

  IF p_age IS NOT NULL AND p_age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative';
  END IF;

  INSERT INTO public.pets (
    name,
    species,
    species_detail,
    breed,
    sex,
    date_of_birth,
    age,
    color,
    notes
  )
  VALUES (
    btrim(p_name),
    p_species,
    CASE WHEN p_species = 'other' THEN nullif(btrim(p_species_detail), '') ELSE NULL END,
    nullif(btrim(p_breed), ''),
    p_sex,
    p_date_of_birth,
    p_age,
    nullif(btrim(p_color), ''),
    nullif(btrim(p_notes), '')
  )
  RETURNING * INTO new_pet;

  INSERT INTO public.pet_owners (
    pet_id,
    owner_profile_id,
    relationship,
    is_primary_contact,
    can_view_medical_records,
    can_receive_notifications
  )
  VALUES (
    new_pet.id,
    (SELECT auth.uid()),
    'owner',
    true,
    true,
    true
  );

  RETURN new_pet;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, profile_full_name)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), EXCLUDED.full_name);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_appointment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_status_history (
      appointment_id,
      previous_status,
      new_status,
      changed_by_id,
      reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_user_id,
      CASE
        WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason::text
        WHEN NEW.status = 'scheduled' AND OLD.status = 'requested' THEN 'confirmed'
        WHEN NEW.status = 'no_show' THEN 'no_show'
        ELSE NULL
      END,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  UPDATE public.profiles
  SET
    email = NEW.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), profile_full_name)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

grant delete on table "public"."appointment_schedules" to "anon";

grant insert on table "public"."appointment_schedules" to "anon";

grant references on table "public"."appointment_schedules" to "anon";

grant select on table "public"."appointment_schedules" to "anon";

grant trigger on table "public"."appointment_schedules" to "anon";

grant truncate on table "public"."appointment_schedules" to "anon";

grant update on table "public"."appointment_schedules" to "anon";

grant delete on table "public"."appointment_schedules" to "authenticated";

grant insert on table "public"."appointment_schedules" to "authenticated";

grant references on table "public"."appointment_schedules" to "authenticated";

grant select on table "public"."appointment_schedules" to "authenticated";

grant trigger on table "public"."appointment_schedules" to "authenticated";

grant truncate on table "public"."appointment_schedules" to "authenticated";

grant update on table "public"."appointment_schedules" to "authenticated";

grant delete on table "public"."appointment_schedules" to "service_role";

grant insert on table "public"."appointment_schedules" to "service_role";

grant references on table "public"."appointment_schedules" to "service_role";

grant select on table "public"."appointment_schedules" to "service_role";

grant trigger on table "public"."appointment_schedules" to "service_role";

grant truncate on table "public"."appointment_schedules" to "service_role";

grant update on table "public"."appointment_schedules" to "service_role";

grant delete on table "public"."appointment_status_history" to "anon";

grant insert on table "public"."appointment_status_history" to "anon";

grant references on table "public"."appointment_status_history" to "anon";

grant select on table "public"."appointment_status_history" to "anon";

grant trigger on table "public"."appointment_status_history" to "anon";

grant truncate on table "public"."appointment_status_history" to "anon";

grant update on table "public"."appointment_status_history" to "anon";

grant delete on table "public"."appointment_status_history" to "authenticated";

grant insert on table "public"."appointment_status_history" to "authenticated";

grant references on table "public"."appointment_status_history" to "authenticated";

grant select on table "public"."appointment_status_history" to "authenticated";

grant trigger on table "public"."appointment_status_history" to "authenticated";

grant truncate on table "public"."appointment_status_history" to "authenticated";

grant update on table "public"."appointment_status_history" to "authenticated";

grant delete on table "public"."appointment_status_history" to "service_role";

grant insert on table "public"."appointment_status_history" to "service_role";

grant references on table "public"."appointment_status_history" to "service_role";

grant select on table "public"."appointment_status_history" to "service_role";

grant trigger on table "public"."appointment_status_history" to "service_role";

grant truncate on table "public"."appointment_status_history" to "service_role";

grant update on table "public"."appointment_status_history" to "service_role";

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."check_ins" to "anon";

grant insert on table "public"."check_ins" to "anon";

grant references on table "public"."check_ins" to "anon";

grant select on table "public"."check_ins" to "anon";

grant trigger on table "public"."check_ins" to "anon";

grant truncate on table "public"."check_ins" to "anon";

grant update on table "public"."check_ins" to "anon";

grant delete on table "public"."check_ins" to "authenticated";

grant insert on table "public"."check_ins" to "authenticated";

grant references on table "public"."check_ins" to "authenticated";

grant select on table "public"."check_ins" to "authenticated";

grant trigger on table "public"."check_ins" to "authenticated";

grant truncate on table "public"."check_ins" to "authenticated";

grant update on table "public"."check_ins" to "authenticated";

grant delete on table "public"."check_ins" to "service_role";

grant insert on table "public"."check_ins" to "service_role";

grant references on table "public"."check_ins" to "service_role";

grant select on table "public"."check_ins" to "service_role";

grant trigger on table "public"."check_ins" to "service_role";

grant truncate on table "public"."check_ins" to "service_role";

grant update on table "public"."check_ins" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."pet_owners" to "anon";

grant insert on table "public"."pet_owners" to "anon";

grant references on table "public"."pet_owners" to "anon";

grant select on table "public"."pet_owners" to "anon";

grant trigger on table "public"."pet_owners" to "anon";

grant truncate on table "public"."pet_owners" to "anon";

grant update on table "public"."pet_owners" to "anon";

grant delete on table "public"."pet_owners" to "authenticated";

grant insert on table "public"."pet_owners" to "authenticated";

grant references on table "public"."pet_owners" to "authenticated";

grant select on table "public"."pet_owners" to "authenticated";

grant trigger on table "public"."pet_owners" to "authenticated";

grant truncate on table "public"."pet_owners" to "authenticated";

grant update on table "public"."pet_owners" to "authenticated";

grant delete on table "public"."pet_owners" to "service_role";

grant insert on table "public"."pet_owners" to "service_role";

grant references on table "public"."pet_owners" to "service_role";

grant select on table "public"."pet_owners" to "service_role";

grant trigger on table "public"."pet_owners" to "service_role";

grant truncate on table "public"."pet_owners" to "service_role";

grant update on table "public"."pet_owners" to "service_role";

grant delete on table "public"."pets" to "anon";

grant insert on table "public"."pets" to "anon";

grant references on table "public"."pets" to "anon";

grant select on table "public"."pets" to "anon";

grant trigger on table "public"."pets" to "anon";

grant truncate on table "public"."pets" to "anon";

grant update on table "public"."pets" to "anon";

grant delete on table "public"."pets" to "authenticated";

grant insert on table "public"."pets" to "authenticated";

grant references on table "public"."pets" to "authenticated";

grant select on table "public"."pets" to "authenticated";

grant trigger on table "public"."pets" to "authenticated";

grant truncate on table "public"."pets" to "authenticated";

grant update on table "public"."pets" to "authenticated";

grant delete on table "public"."pets" to "service_role";

grant insert on table "public"."pets" to "service_role";

grant references on table "public"."pets" to "service_role";

grant select on table "public"."pets" to "service_role";

grant trigger on table "public"."pets" to "service_role";

grant truncate on table "public"."pets" to "service_role";

grant update on table "public"."pets" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant select on table "public"."staff_audit_logs" to "authenticated";

grant delete on table "public"."staff_audit_logs" to "service_role";

grant insert on table "public"."staff_audit_logs" to "service_role";

grant references on table "public"."staff_audit_logs" to "service_role";

grant select on table "public"."staff_audit_logs" to "service_role";

grant trigger on table "public"."staff_audit_logs" to "service_role";

grant truncate on table "public"."staff_audit_logs" to "service_role";

grant update on table "public"."staff_audit_logs" to "service_role";


  create policy "Allow read for authenticated"
  on "public"."appointment_schedules"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow write for staff/admin"
  on "public"."appointment_schedules"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['veterinarian'::public.user_role, 'admin'::public.user_role]))))));



  create policy "admins manage appointment schedules"
  on "public"."appointment_schedules"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "allow authenticated to view appointment schedules"
  on "public"."appointment_schedules"
  as permissive
  for select
  to authenticated
using (true);



  create policy "staff view appointment schedules"
  on "public"."appointment_schedules"
  as permissive
  for select
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "owners view appointment status history"
  on "public"."appointment_status_history"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.appointments a
     JOIN public.pet_owners po ON ((po.pet_id = a.pet_id)))
  WHERE ((a.id = appointment_status_history.appointment_id) AND (po.owner_profile_id = ( SELECT auth.uid() AS uid))))));



  create policy "staff view appointment status history"
  on "public"."appointment_status_history"
  as permissive
  for select
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "system insert status history"
  on "public"."appointment_status_history"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "admins delete appointments"
  on "public"."appointments"
  as permissive
  for delete
  to authenticated
using (( SELECT private.is_admin() AS is_admin));



  create policy "owners cancel own appointments"
  on "public"."appointments"
  as permissive
  for update
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))) AND (status = ANY (ARRAY['requested'::public.appointment_status, 'scheduled'::public.appointment_status]))))
with check (((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))) AND (((status = 'cancelled'::public.appointment_status) AND (status = ANY (ARRAY['requested'::public.appointment_status, 'scheduled'::public.appointment_status]))) OR (status = 'requested'::public.appointment_status))));



  create policy "owners create appointments"
  on "public"."appointments"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))) AND (status = 'requested'::public.appointment_status) AND (owner_id = ( SELECT auth.uid() AS uid))));



  create policy "owners view own appointments"
  on "public"."appointments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = appointments.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))));



  create policy "staff manage appointments"
  on "public"."appointments"
  as permissive
  for update
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))))
with check ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "staff view all appointments"
  on "public"."appointments"
  as permissive
  for select
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "owners view check-ins"
  on "public"."check_ins"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = check_ins.pet_id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))));



  create policy "staff manage check-ins"
  on "public"."check_ins"
  as permissive
  for all
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))))
with check ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "staff view check-ins"
  on "public"."check_ins"
  as permissive
  for select
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "admins manage notifications"
  on "public"."notifications"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "admins manage pet_owners"
  on "public"."pet_owners"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "owners view own pet_owners"
  on "public"."pet_owners"
  as permissive
  for select
  to authenticated
using ((owner_profile_id = ( SELECT auth.uid() AS uid)));



  create policy "veterinarians view pet_owners"
  on "public"."pet_owners"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role)))));



  create policy "admins manage pets"
  on "public"."pets"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "owners update linked pets"
  on "public"."pets"
  as permissive
  for update
  to authenticated
using ((( SELECT private.is_owner() AS is_owner) AND (EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid)))))))
with check ((( SELECT private.is_owner() AS is_owner) AND (EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid)))))));



  create policy "owners view linked pets"
  on "public"."pets"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.pet_owners
  WHERE ((pet_owners.pet_id = pets.id) AND (pet_owners.owner_profile_id = ( SELECT auth.uid() AS uid))))));



  create policy "staff view all pets"
  on "public"."pets"
  as permissive
  for select
  to authenticated
using ((( SELECT private.is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'veterinarian'::public.user_role))))));



  create policy "admins manage profiles"
  on "public"."profiles"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "users update own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check (((( SELECT auth.uid() AS uid) = id) AND ( SELECT private.is_own_profile_update_permitted(profiles.email, profiles.role, profiles.is_active) AS is_own_profile_update_permitted)));



  create policy "users view own profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "veterinarians view owner profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (((role = 'owner'::public.user_role) AND ( SELECT private.is_veterinarian() AS is_veterinarian)));



  create policy "Allow public read access on services"
  on "public"."services"
  as permissive
  for select
  to public
using (true);



  create policy "admins manage services"
  on "public"."services"
  as permissive
  for all
  to authenticated
using (( SELECT private.is_admin() AS is_admin))
with check (( SELECT private.is_admin() AS is_admin));



  create policy "public read published services"
  on "public"."services"
  as permissive
  for select
  to anon, authenticated
using ((is_published = true));



  create policy "admins view staff audit logs"
  on "public"."staff_audit_logs"
  as permissive
  for select
  to authenticated
using (( SELECT private.is_admin() AS is_admin));


CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_log_appointment_status_change AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.log_appointment_status_change();

CREATE TRIGGER check_ins_updated_at BEFORE UPDATE ON public.check_ins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER pet_owners_updated_at BEFORE UPDATE ON public.pet_owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER protect_final_active_admin BEFORE UPDATE OF role, is_active ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.prevent_removing_final_active_admin();

CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


