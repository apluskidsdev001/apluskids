create table special_events (
  id bigserial primary key,
  public_id uuid not null unique,
  name varchar(160) not null,
  event_date date not null,
  place varchar(160) not null,
  video_url varchar(2048),
  description text,
  guests_json text not null default '[]',
  contact varchar(120),
  cover_filename varchar(255),
  cover_media_type varchar(100),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 0
);

create index idx_special_events_active_order on special_events(active, display_order, event_date);
