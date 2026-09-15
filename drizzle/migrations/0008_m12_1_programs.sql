-- M12.1 — Catalogo progetti: schema e seed.
--
-- L'associazione ragiona per progetti, ognuno svolto in più sedi: qui nasce il
-- livello progetto → sedi. Quattro modelli di iscrizione:
--   settimane       iscrizione per settimane con registro (Centri estivi, M11)
--   periodo         periodo o abbonamento ricorrente (flusso in M14)
--   ciclo_incontri  numero chiuso di incontri, famiglia in blocco (flusso in M14)
--   vetrina         nessuna iscrizione online: pagina + richiesta contatto
--
-- Scelte documentate:
--  * I testi dei progetti vivono SOLO qui e restano modificabili dall'admin:
--    il seed è un contenuto iniziale, nessun componente li contiene.
--  * I progetti del seed nascono in BOZZA: la specifica chiede che Davide li
--    riveda dall'editor prima della pubblicazione (refusi e informazioni
--    datate nel documento di origine). Le sedi e gli URL dei centri estivi
--    non dipendono da questo stato e restano online come oggi.
--  * long_description è testo semplice con grassetto in stile markdown
--    (**testo**), come nella specifica: niente HTML nel database.
--  * locations.type (M10.1) resta per compatibilità ma è DEPRECATO come
--    classificazione: la fonte di verità diventa locations.program_id. Il
--    codice attuale lo usa ancora per etichette e filtri; lo sostituirà il
--    selettore di progetto dell'editor sede (M12.2).
--  * locations.program_id è NULLABILE in questa migrazione: tutte le sedi
--    esistenti vengono collegate a Centri estivi, ma l'editor sede non sa
--    ancora sceglierlo e renderlo obbligatorio adesso impedirebbe di creare
--    sedi dal pannello. Diventa obbligatorio in M12.2, insieme al selettore.
--  * Nessuna voce in audit_log per il seed: è una migrazione. Creazione,
--    modifica, duplicazione e archiviazione dall'admin passano dalle server
--    function di M12.2, che scrivono l'audit.

create type public.program_category as enum ('scolastico', 'extrascolastico');
create type public.enrollment_model as enum ('settimane', 'periodo', 'ciclo_incontri', 'vetrina');
create type public.program_status as enum ('bozza', 'pubblicato', 'archiviato');
create type public.program_target as enum ('nido', 'infanzia', 'primaria', 'secondaria', 'adulti', 'famiglie');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.program_category not null,
  enrollment_model public.enrollment_model not null,
  subtitle text not null default '',
  short_description text not null default '',
  long_description text not null default '',
  age_range text not null default '',          -- fascia d'età, testo libero
  targets public.program_target[] not null default '{}',
  period_label text not null default '',       -- durata/periodo indicativo
  cover_image_path text,                       -- bucket privato, gestito da M12.2
  theme text not null default 'royal',         -- colore identificativo
  sort_order int not null default 0,
  status public.program_status not null default 'bozza',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint programs_name_not_empty check (char_length(trim(name)) > 0),
  constraint programs_theme_valid check (theme in ('sun', 'grass', 'magic', 'flame', 'royal'))
);

create index programs_category_idx on public.programs (category, sort_order);

create trigger programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

-- Come per le sedi: lo slug diventa URL pubblico (M12.4), quindi dopo la
-- pubblicazione non si cambia più, nemmeno da archiviato.
create or replace function public.programs_lock_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('pubblicato', 'archiviato') and new.slug <> old.slug then
    raise exception 'Lo slug di un progetto pubblicato o archiviato non può essere modificato';
  end if;
  return new;
end;
$$;

create trigger programs_lock_slug
  before update on public.programs
  for each row execute function public.programs_lock_slug();

-- ---------------------------------------------------------------------------
-- Sede → progetto
-- ---------------------------------------------------------------------------
alter table public.locations
  add column program_id uuid references public.programs(id) on delete restrict;

create index locations_program_idx on public.locations (program_id);

-- ---------------------------------------------------------------------------
-- RLS: lettura pubblica dei soli pubblicati, admin legge e scrive tutto.
-- ---------------------------------------------------------------------------
alter table public.programs enable row level security;

create policy "progetti pubblicati visibili a tutti" on public.programs
  for select using (status = 'pubblicato' or public.has_role(auth.uid(), 'admin'));
create policy "admin crea progetti" on public.programs
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna progetti" on public.programs
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina progetti" on public.programs
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Su Lovable Cloud i privilegi non arrivano dai default.
grant select on public.programs to anon, authenticated;
grant insert, update, delete on public.programs to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: i sette progetti della specifica, in bozza. Testi tra delimitatori
-- $t$…$t$ per non alterarne apostrofi e virgolette.
-- ---------------------------------------------------------------------------
insert into public.programs
  (slug, name, category, enrollment_model, subtitle, short_description, long_description,
   age_range, targets, period_label, theme, sort_order)
values
  ($t$cuccioli-sprint$t$, $t$Cuccioli Sprint$t$, 'scolastico', 'vetrina',
   $t$La nostra proposta per il nido$t$,
   $t$Psicomotricità per i più piccoli: un percorso di attività cognitivo-motoria pensato per i bambini dai 20 mesi ai tre anni.$t$,
   $t$Alle bambine e ai bambini del nido proponiamo un percorso che tiene insieme gioco, movimento, emozioni e relazione. L'attività non è solo motoria: coinvolge la sfera ludica, psicologica, affettiva, cognitiva e sociale, perché a questa età ogni gesto è anche scoperta di sé e degli altri. Lavoriamo sugli schemi motori di base, sulle capacità senso-percettive e coordinative, e su obiettivi educativi come l'ascolto, il rispetto dei compagni e delle regole, la collaborazione. Gli incontri sono curati da insegnanti qualificati e organizzati intorno a tre elementi: uno spazio sicuro e accogliente, tempi inseriti nella programmazione della struttura, materiali adatti e in quantità sufficiente perché ogni bambino abbia il proprio attrezzo con cui giocare.$t$,
   $t$20 mesi – 3 anni$t$, array['nido']::public.program_target[], $t$$t$, 'sun', 1),
  ($t$felici-di-crescere-cosi$t$, $t$Felici di crescere così$t$, 'scolastico', 'vetrina',
   $t$La nostra proposta per la scuola dell'infanzia$t$,
   $t$Attività cognitivo-motoria per le scuole dell'infanzia, su tutte le fasce d'età, per circa 30 settimane da ottobre a maggio.$t$,
   $t$Il progetto accompagna i bambini di 3, 4 e 5 anni con proposte che cambiano secondo la maturità del gruppo, nel rispetto del percorso educativo della scuola e con attenzione ai bambini con disabilità o difficoltà cognitive. Gli obiettivi sono ampi: dare un bagaglio motorio solido su cui costruire le esperienze sportive future, far conoscere le realtà sportive del territorio, prevenire l'abbandono precoce dello sport, formare la personalità dentro il gruppo. Il percorso si sviluppa in genere su 30-31 settimane, da ottobre a maggio secondo il calendario scolastico, e si chiude con un momento di festa o un saggio, da integrare se la scuola lo desidera alla festa di fine anno. Sono previste lezioni aperte ai genitori durante l'anno e la possibilità di condurre parte delle attività in lingua inglese. Durata e struttura si adattano alle esigenze dell'istituto: il preventivo si definisce dopo un incontro, in base al numero di bambini coinvolti.$t$,
   $t$3 – 5 anni$t$, array['infanzia']::public.program_target[], $t$Circa 30 settimane, da ottobre a maggio$t$, 'grass', 2),
  ($t$lets-play-together$t$, $t$Let's Play Together$t$, 'scolastico', 'ciclo_incontri',
   $t$Il gioco come strumento educativo$t$,
   $t$Quattro incontri per giocare insieme, genitori e figli, e scoprire come il gioco diventa uno strumento educativo.$t$,
   $t$Nato dagli anni di lavoro nelle scuole dell'infanzia, questo percorso avvicina le famiglie alla nostra associazione con una proposta rivolta a bambini e genitori insieme. L'obiettivo è dare alcune basi e alcuni concetti di gioco perché i genitori possano giocare con i propri figli in modo più mirato e produttivo. Il progetto si articola in quattro incontri: uno teorico di apertura e tre pratici, preferibilmente il sabato mattina, della durata di un'ora ciascuno. Ogni incontro è condotto da un insegnante di educazione fisica dell'associazione, affiancato da esperte del settore psicologico-pedagogico che spiegano ai genitori gli aspetti educativi, relazionali e affettivi di ogni proposta. Si alternano giochi genitore-figlio, gruppo genitori e gruppo figli, e gruppi misti.$t$,
   $t$Bambini con almeno un genitore$t$, array['famiglie']::public.program_target[], $t$Quattro incontri da un'ora$t$, 'magic', 3),
  ($t$tutti-a-scuola-con-lo-sport$t$, $t$Tutti a scuola con lo Sport$t$, 'scolastico', 'vetrina',
   $t$La nostra proposta per la scuola primaria$t$,
   $t$Integrazione motoria nella scuola primaria: gioco-sport, schemi motori e capacità coordinative nell'età d'oro dell'apprendimento.$t$,
   $t$Tra i 5-6 e i 10-11 anni si colloca la fase più sensibile per lo sviluppo delle capacità coordinative e degli schemi motori. Il progetto porta nelle scuole primarie una formazione cognitivo-motoria di base che integra le leggi della psicocinetica alle regole dei giochi sportivi, senza separare l'aspetto tecnico dalla formazione della personalità. Il lavoro si articola su quattro elementi: strutturazione dello schema corporeo, sviluppo degli schemi motori di base, formazione delle capacità coordinative, crescita della sfera psico-sociale e affettiva. Le proposte si differenziano tra primo ciclo (6-7 anni) e secondo ciclo (8-11 anni). Tra i gioco-sport trattati: gioco-attrezzo, giocatletica, minibasket, gioco-pallamano, minivolley, minitennis, giochi con la palla, acrogym e, dove possibile, accompagnamento ai corsi di nuoto. Le lezioni si svolgono in orario curricolare, in presenza dell'insegnante scolastico, in palestre scolastiche o comunali. A conclusione del ciclo si può organizzare una manifestazione finale o una lezione aperta ai genitori. Per ogni attività non presente in elenco, l'associazione mette a disposizione istruttori preparati e insegnanti qualificati.$t$,
   $t$6 – 11 anni$t$, array['primaria']::public.program_target[], $t$$t$, 'royal', 4),
  ($t$centri-estivi$t$, $t$Centri estivi$t$, 'extrascolastico', 'settimane',
   $t$La nostra proposta per l'estate$t$,
   $t$Estate di sport, giochi, laboratori e uscite nelle province di Padova, Vicenza e Verona.$t$,
   $t$Le giornate iniziano con l'accoglienza dalle 7:45 e proseguono fino alle 16:15, tra gioco libero e organizzato, attività sportive e laboratori creativi, con proposte differenziate per età e bambini seguiti a piccoli gruppi. Tra le attività: tiro con l'arco, escursioni, equitazione, piscina, giochi d'acqua, grandi tornei, giochi di aggregazione ispirati a temi sempre nuovi, laboratori di teatro, lingua straniera, manipolazione, pittura e cartapesta, con mostra finale dei lavori. A chiudere, una festa con mostra fotografica. È previsto il servizio mensa. L'équipe di animatori lavora insieme da oltre dieci anni: persone maggiorenni, insegnanti, allenatori ed educatori, selezionate e formate, che accompagnano i bambini dall'arrivo del mattino alla fine delle attività.$t$,
   $t$Dall'infanzia alla secondaria di primo grado$t$, array['infanzia', 'primaria', 'secondaria']::public.program_target[], $t$Estate$t$, 'flame', 5),
  ($t$corsi-fitness$t$, $t$Corsi fitness$t$, 'extrascolastico', 'periodo',
   $t$La nostra proposta per tenersi in forma$t$,
   $t$Zumba, ginnastica dolce e allungamento vertebrale: corsi per adulti, in palestra, vicino a casa.$t$,
   $t$**Zumba** — un'attività dinamica a ritmo di musica per muoversi, divertirsi e restare in forma, tonificare il fisico e scaricare le tensioni della giornata in compagnia. La prima lezione di prova è gratuita. **Ginnastica dolce** — un mix di esercizi aerobici e di tonificazione che mantiene funzionali articolazioni e struttura muscolo-legamentosa e, attraverso il controllo della respirazione, allena cuore e polmoni. Serve solo un certificato medico e voglia di stare bene. **Allungamento vertebrale** — un corso di cinque incontri per capire come evitare i problemi legati all'uso scorretto della schiena e come gestire lombalgie, dorsalgie e cervicalgie con pochi esercizi quotidiani di scarico della colonna e semplici accorgimenti posturali. Per sapere se c'è un corso vicino a casa tua, scrivici.$t$,
   $t$Adulti$t$, array['adulti']::public.program_target[], $t$$t$, 'grass', 6),
  ($t$doposcuola$t$, $t$Doposcuola$t$, 'extrascolastico', 'periodo',
   $t$Quando il tempo non è mai abbastanza arriviamo noi$t$,
   $t$Dal ritiro a scuola ai compiti del pomeriggio, un servizio costruito sulle esigenze di ogni territorio.$t$,
   $t$Dopo dieci anni di esperienza nel territorio termale di Abano, prepariamo il servizio su misura del contesto in cui operiamo. Si parte dal ritiro dei bambini all'uscita da scuola, si prosegue con l'assistenza durante il pranzo e il momento di svago, poi con l'aiuto ai compiti pomeridiani e i laboratori, sia ludici sia sportivo-motori. Ogni progetto viene costruito insieme, in base alle necessità della famiglia o dell'amministrazione che lo richiede.$t$,
   $t$Bambini in età scolare$t$, array['primaria', 'secondaria']::public.program_target[], $t$$t$, 'royal', 7)
on conflict (slug) do nothing;

-- Tutte le sedi esistenti sono centri estivi.
update public.locations
set program_id = (select id from public.programs where slug = 'centri-estivi')
where program_id is null;