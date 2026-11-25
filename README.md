# Meldingen technische dienst – Sint-Michiel

Met deze webapp melden collega's een **defect** of vragen ze een **taak** aan. De directeur en de beheerder volgen de aanvragen op, wijzen ze toe en sluiten ze af.

- **Meldingsformulier** (`/`): openbaar. Iedereen met de link kan het gebruiken, zonder in te loggen. Het werkt vlot op een smartphone.
- **Beheer** (`/beheer`): alleen voor de accounts in `ADMIN_EMAILS`, na aanmelden met Microsoft 365.

---

## Inhoud

1. [Hoe werkt de app? (in gewone taal)](#1-hoe-werkt-de-app-in-gewone-taal)
2. [Dagelijks gebruik](#2-dagelijks-gebruik)
3. [Alle omgevingsvariabelen](#3-alle-omgevingsvariabelen)
4. [Handleiding voor IT: Microsoft Entra instellen](#4-handleiding-voor-it-microsoft-entra-instellen)
5. [Stap voor stap online zetten op Vercel](#5-stap-voor-stap-online-zetten-op-vercel)
6. [Lokaal opstarten (op je eigen computer)](#6-lokaal-opstarten-op-je-eigen-computer)
7. [Testgegevens en testmodus](#7-testgegevens-en-testmodus)
8. [Onderhoud en veelgestelde vragen](#8-onderhoud-en-veelgestelde-vragen)

---

## 1. Hoe werkt de app? (in gewone taal)

| Onderdeel | Wat het doet | Waar het draait |
|---|---|---|
| De website | Formulier, overzicht, archief | **Vercel** (webhost) |
| De database | Bewaart alle aanvragen, zoals een grote tabel | **Neon Postgres** (via Vercel) |
| Foto-opslag | Bewaart de foto's, privé | **Vercel Blob** |
| Microsoft 365 | Inloggen van de beheerders en versturen van alle mails | Jullie eigen Microsoft-omgeving |

Geheime gegevens zoals wachtwoorden, sleutels en mailadressen staan **nooit** in de code. Je vult ze in Vercel in als **omgevingsvariabelen**. Dat werkt zoals een lijstje instellingen.

### De levensloop van een aanvraag

```
Collega vult formulier in
        │
        ▼
Nieuwe aanvraag (volgnummer bv. 2026-0001)
  ├─ mail naar directeur + beheerder (met link naar de aanvraag)
  └─ ontvangstbevestiging naar de aanvrager
        │
        ▼
ACTIEF OVERZICHT
  ├─ Status G   → mail naar aanvrager "doorgegeven aan de technische dienst"
  │     → prioriteit + klusjesman → werk uitgevoerd
  │     → Controle OK → ARCHIEF (per schooljaar, volgens controledatum)
  │
  └─ Status NG + reden → mail naar aanvrager "wordt niet uitgevoerd"
        → NIET UITGEVOERD (één lijst, alle schooljaren samen)
```

- Een aanvraag wordt **nooit verwijderd**.
- Elke wijziging komt in de **historiek**: wie heeft wat wanneer gewijzigd.
- Uit het archief en uit "Niet uitgevoerd" kun je een aanvraag altijd **terugzetten** naar het actieve overzicht.

---

## 2. Dagelijks gebruik

### Overzicht (actieve aanvragen)

- **Status** (– / G / NG):
  - **G**: na een bevestiging krijgt de aanvrager meteen een mail.
  - **NG**: er opent een venster met het verplichte veld **Reden**. Pas na **"Bevestigen en mail versturen"** wordt de status opgeslagen en de mail verstuurd. De aanvraag verhuist dan naar **Niet uitgevoerd**.
  - Een statusmail wordt maar één keer verstuurd. Kies je opnieuw dezelfde status, dan gebeurt er niets. Verandert de status echt (bv. van NG naar G), dan vertrekt de mail voor de nieuwe status.
- **Mail**: toont of en wanneer de statusmail verstuurd werd. Mislukt het versturen, dan zie je een rode melding en de knop **Opnieuw versturen**.
- **Prio** (1 = dringendst), **Toegewezen aan** (alleen actieve klusjesmannen) en **Interne opmerking** worden meteen opgeslagen. Je ziet dan kort "✓ opgeslagen".
- **Controle OK**: de controledatum wordt automatisch ingevuld en de aanvraag verhuist naar het **Archief**.
- Klik op een **beschrijving** om ze volledig te lezen. Klik op een **foto** om ze te vergroten.
- Klik op het **volgnummer** of op **Details** voor alles over één aanvraag: gegevens, foto's, historiek en mails.
- Je kunt **filteren** op campus, soort, status, prioriteit en klusjesman, **sorteren** op datum of prioriteit en **zoeken** op tekst. Druk daarna op **Toepassen**.
- Met **Exporteren naar Excel** download je het gefilterde overzicht. Het bestand heeft een tweede tabblad met de historiek.

### Archief

- Kies een **schooljaar** (1 september t.e.m. 31 augustus), op basis van de **controledatum**. Voorbeeld: een controle op 15/09/2026 valt in schooljaar 2026-2027.
- Je kunt filteren, zoeken en exporteren naar Excel, met alle gegevens en de historiek.
- Met **Terugzetten** gaat Controle terug op NOK, wordt de controledatum gewist en verschijnt de aanvraag opnieuw in het actieve overzicht.

### Niet uitgevoerd

- Hier staan alle NG-aanvragen van alle jaren samen, met de reden en de mailstatus.
- Met **Terugzetten** wordt de status leeggemaakt en gaat de aanvraag terug naar het actieve overzicht. Er wordt geen mail verstuurd. Zet je de aanvraag daarna op G, dan krijgt de aanvrager de G-mail.

### Klusjesmannen

- Hier kun je klusjesmannen **toevoegen**, hun naam **wijzigen** en ze **op inactief zetten**. Verwijderen kan niet, zodat de historiek klopt.
- De knop **Afdruklijst** maakt per klusjesman een lijst met zijn openstaande aanvragen: toegewezen, status G en nog niet gecontroleerd. De lijst is gesorteerd op prioriteit. Klik op **Afdrukken / opslaan als PDF** en kies in het afdrukvenster "Opslaan als PDF" of een printer.
- Klusjesmannen krijgen geen mails en hebben geen toegang tot de app.

### Mails

**Mailteksten aanpassen.** Bovenaan staan vier knoppen, één per soort mail:
- Nieuwe aanvraag
- Ontvangstbevestiging
- Goedgekeurd (G)
- Niet goedgekeurd (NG)

Klik op een knop. In het popupvenster pas je het **onderwerp** en de **inhoud** aan, en rechts zie je meteen een voorbeeld.
- **Invulvelden** zoals `{naam}`, `{volgnummer}`, `{soort}`, `{campus}` en `{locatie}` worden automatisch ingevuld. Klik op een invulveld om het in te voegen.
- `{knop}` (alleen bij "Nieuwe aanvraag") wordt de knop "Open de aanvraag in het overzicht".
- `{reden}` is verplicht in de mail bij NG.
- Een lege regel begint een nieuwe alinea. Zet tekst tussen `**dubbele sterretjes**` om hem vet te maken.
- Met **Standaardtekst herstellen** zet je de oorspronkelijke tekst terug.

Een gewijzigde tekst geldt voor alle mails die daarna verstuurd worden.

**Logboek.** Daaronder staat een logboek van alle verstuurde en mislukte mails, met een knop **Opnieuw versturen** bij elke mislukte mail.

---

## 3. Alle omgevingsvariabelen

Je stelt ze in via Vercel → je project → **Settings → Environment Variables**. Lokaal staan ze in het bestand `.env`. Een voorbeeld vind je in `.env.example`.

| Naam | Verplicht | Uitleg | Voorbeeld |
|---|---|---|---|
| `DATABASE_URL` | ja | Verbinding met de database. **Wordt automatisch ingevuld** door Neon. | `postgresql://...` |
| `DATABASE_URL_UNPOOLED` | ja | Rechtstreekse verbinding, nodig om de database bij te werken. **Wordt automatisch ingevuld** door Neon. | `postgresql://...` |
| `BLOB_READ_WRITE_TOKEN` | ja (op Vercel) | Sleutel voor de foto-opslag. **Wordt automatisch ingevuld** door Vercel Blob. | `vercel_blob_rw_...` |
| `AUTH_SECRET` | ja | Lange willekeurige tekst om de login te beveiligen. Maak er een met `openssl rand -base64 32`. | `k3J9...` |
| `ENTRA_TENANT_ID` | ja | Directory (tenant) ID uit Entra | `1234abcd-...` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | ja | Application (client) ID uit Entra | `abcd1234-...` |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | ja | Client secret (de "Value") uit Entra | `Abc8Q~...` |
| `ADMIN_EMAILS` | ja | Wie mag inloggen op het beheer. Scheid adressen met een komma. | `geert.demeulemeester@sintmichiel.be,stefan.verpoorten@sintmichiel.be` |
| `NOTIFY_EMAILS` | ja | Wie een mail krijgt bij een nieuwe aanvraag. Scheid adressen met een komma. | idem |
| `MAIL_FROM` | ja | Het afzenderadres van alle mails | `stefan.verpoorten@sintmichiel.be` |
| `MAIL_MODE` | ja | `test` = niets versturen, enkel loggen. `live` = echt versturen. | `live` |
| `APP_URL` | aanbevolen | Het webadres van de app. Dit wordt gebruikt voor de link in de mails. | `https://sintmichiel-meldingen.vercel.app` |
| `RATE_LIMIT_MAX` | nee | Maximum aantal aanvragen per IP-adres binnen de tijdspanne. Standaard 5. | `5` |
| `RATE_LIMIT_WINDOW_MIN` | nee | Die tijdspanne in minuten. Standaard 15. | `15` |
| `FOTO_OPSLAG` | nee | `database` = foto's altijd in de database bewaren in plaats van in Vercel Blob. Handig als Blob niet werkt. Zonder deze instelling probeert de app eerst Blob en valt ze automatisch terug op de database. | `database` |
| `FORMULIER_URL` | nee | Het webadres van het gecombineerde formulier (repository `sintmichiel-formulier`). Alleen dat adres mag dit formulier in een kader tonen. Leeg = het formulier kan nergens ingebed worden. | `https://sintmichiel-formulier.vercel.app` |
| `IP_HASH_SALT` | nee | Extra geheim om IP-adressen onleesbaar op te slaan. Standaard wordt `AUTH_SECRET` gebruikt. | |
| `AUTH_DEV_LOGIN` | nee | `true` = testlogin zonder Microsoft. **Werkt nooit op Vercel**, enkel lokaal. | `true` |

> ⚠️ Pas je een omgevingsvariabele aan in Vercel? Dan moet je de app opnieuw uitrollen voor de wijziging actief wordt: **Deployments → … → Redeploy**.

---

## 4. Handleiding voor IT: Microsoft Entra instellen

We maken **één app-registratie** die voor twee dingen dient:

1. **Inloggen** van de beheerders (gedelegeerde rechten: `openid`, `profile`, `email`, `User.Read`).
2. **Mails versturen** via Microsoft Graph (applicatierecht: `Mail.Send`). We **beperken** dat recht zodat de app alleen kan mailen vanaf `stefan.verpoorten@sintmichiel.be`.

Je hebt een account nodig met de rol **Application Administrator** (of Global Administrator) en, voor stap 4.6, **Exchange Administrator**.

### 4.1 App-registratie aanmaken

1. Ga naar <https://entra.microsoft.com>.
2. Ga naar **Identity → Applications → App registrations → + New registration**.
3. Vul in:
   - **Name**: `Meldingen Sint-Michiel`
   - **Supported account types**: *Accounts in this organizational directory only (Single tenant)*
   - **Redirect URI**: kies platform **Web** en vul in:
     `https://<jouw-project>.vercel.app/api/auth/callback/microsoft-entra-id`
     (bv. `https://sintmichiel-meldingen.vercel.app/api/auth/callback/microsoft-entra-id`)
4. Klik op **Register**.
5. Wil je ook lokaal testen met Microsoft-login? Ga dan naar **Authentication → Add URI** en voeg toe:
   `http://localhost:3000/api/auth/callback/microsoft-entra-id`

### 4.2 ID's noteren

Op de pagina **Overview** van de app noteer je:

| In Entra | Omgevingsvariabele |
|---|---|
| Application (client) ID | `AUTH_MICROSOFT_ENTRA_ID_ID` |
| Directory (tenant) ID | `ENTRA_TENANT_ID` |

### 4.3 Client secret aanmaken

1. Ga naar **Certificates & secrets → Client secrets → + New client secret**.
2. Vul in:
   - **Description**: `Vercel`
   - **Expires**: 24 months
3. Kopieer meteen de kolom **Value**, niet de "Secret ID". Die waarde wordt maar één keer getoond.
4. Zet ze in `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
5. 📅 **Zet een herinnering in je agenda** een maand voor de vervaldatum. Is het secret vervallen, dan werken inloggen en mailen niet meer. Maak dan een nieuw secret aan, vervang het in Vercel en klik op Redeploy.

### 4.4 API-permissies

Ga naar **API permissions → + Add a permission → Microsoft Graph**.

1. Kies **Delegated permissions** en vink aan: `openid`, `profile`, `email`, `User.Read`. `User.Read` staat er meestal al.
2. Kies opnieuw **+ Add a permission → Microsoft Graph → Application permissions** en vink aan: `Mail.Send`.
3. Klik op **Grant admin consent for Sint-Michiel** en bevestig. Alle regels krijgen een groen vinkje.

> ⚠️ Zonder de beperking uit stap 4.6 kan de app met `Mail.Send` mailen **als eender welke mailbox** in de school. Sla stap 4.6 dus niet over.

### 4.5 (Aanbevolen) Alleen de beheerders laten inloggen

De app laat alleen de adressen uit `ADMIN_EMAILS` binnen. Je kunt dit ook in Entra zelf afdwingen:

1. Ga naar **Identity → Applications → Enterprise applications** en open **Meldingen Sint-Michiel**.
2. Ga naar **Properties** en zet **Assignment required?** op **Yes**. Klik op **Save**.
3. Ga naar **Users and groups → + Add user/group** en voeg Geert De Meulemeester en Stefan Verpoorten toe.

### 4.6 Mail.Send beperken tot de afzendermailbox (Application Access Policy)

Dit doe je in **Exchange Online PowerShell**, op een Windows-pc met PowerShell, als Exchange-beheerder.

```powershell
# 1. Module installeren (eenmalig) en aanmelden
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline -UserPrincipalName jouw.admin@sintmichiel.be

# 2. Beveiligingsgroep met enkel de afzendermailbox als lid
New-DistributionGroup -Name "App Meldingen - afzender" `
  -Alias "app-meldingen-afzender" `
  -Type Security `
  -Members "stefan.verpoorten@sintmichiel.be"

# 3. De app enkel toegang geven tot de leden van die groep
#    Vervang <CLIENT-ID> door de Application (client) ID uit stap 4.2
New-ApplicationAccessPolicy -AppId "<CLIENT-ID>" `
  -PolicyScopeGroupId "app-meldingen-afzender@sintmichiel.be" `
  -AccessRight RestrictAccess `
  -Description "Meldingsapp mag enkel mailen vanaf stefan.verpoorten"

# 4. Controleren
Test-ApplicationAccessPolicy -Identity "stefan.verpoorten@sintmichiel.be" -AppId "<CLIENT-ID>"
#    → AccessCheckResult : Granted
Test-ApplicationAccessPolicy -Identity "geert.demeulemeester@sintmichiel.be" -AppId "<CLIENT-ID>"
#    → AccessCheckResult : Denied
```

> ℹ️ Het kan tot een uur (soms langer) duren voor de policy actief is.

> ℹ️ Verandert later het afzenderadres (`MAIL_FROM`)? Voeg dan de nieuwe mailbox toe als lid van de groep:
> `Add-DistributionGroupMember -Identity "app-meldingen-afzender" -Member nieuw.adres@sintmichiel.be`

#### Alternatief: RBAC for Applications (de nieuwere methode van Microsoft)

Microsoft raadt voor nieuwe installaties **RBAC for Applications** aan. Op termijn vervangt dat de Application Access Policies. Kies **één** van beide methodes.

1. Verwijder bij deze methode in Entra de **applicatiepermissie `Mail.Send`** uit stap 4.4. Laat de gedelegeerde login-permissies staan. De Entra-permissie geeft namelijk toegang tot álle mailboxen, en RBAC kan dat niet inperken.
2. Voer daarna dit uit:

```powershell
Connect-ExchangeOnline -UserPrincipalName jouw.admin@sintmichiel.be

# <OBJECT-ID> = Object ID van de app bij "Enterprise applications" (NIET bij App registrations)
New-ServicePrincipal -AppId "<CLIENT-ID>" -ObjectId "<OBJECT-ID>" -DisplayName "Meldingen Sint-Michiel"

New-ManagementScope -Name "Meldingen - afzender" `
  -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'stefan.verpoorten@sintmichiel.be'"

New-ManagementRoleAssignment -App "<CLIENT-ID>" -Role "Application Mail.Send" `
  -CustomResourceScope "Meldingen - afzender"

# Controleren
Test-ServicePrincipalAuthorization -Identity "<CLIENT-ID>" -Resource "stefan.verpoorten@sintmichiel.be"
```

### 4.7 Goed om te weten

- Alle mails vertrekken vanaf `stefan.verpoorten@sintmichiel.be` en verschijnen in de map **Verzonden items** van die mailbox.
- Antwoordt een collega op een mail van de app, dan komt dat antwoord in die mailbox terecht.

---

## 5. Stap voor stap online zetten op Vercel

### 5.1 Code op GitHub zetten

De code moet in een GitHub-repository staan, bv. `stefanverpoorten/sintmichiel-meldingen`. Zet de repository op **Private**.

### 5.2 Project aanmaken op Vercel

1. Ga naar <https://vercel.com> en meld je aan met je GitHub-account.
2. Klik op **Add New… → Project**. Kies de repository `sintmichiel-meldingen` en klik op **Import**.
3. Vercel herkent automatisch "Next.js". Laat alle instellingen staan.
4. Klik op **Deploy**. De eerste keer **mislukt** dit, omdat er nog geen database is. Dat is normaal, en je gaat gewoon verder.
5. Noteer het webadres dat Vercel geeft, bv. `https://sintmichiel-meldingen.vercel.app`. Geef het door aan IT voor de Redirect URI in stap 4.1.

### 5.3 Database koppelen (Neon Postgres)

1. Open je project in Vercel en ga naar het tabblad **Storage**.
2. Klik op **Create Database** en kies **Neon** (Serverless Postgres).
3. Kies het gratis plan en als regio **Frankfurt (eu-central-1)**. Dat is het dichtst bij België.
4. Klik op **Connect** en vink alle omgevingen aan (Production, Preview, Development).
5. Vercel maakt nu automatisch `DATABASE_URL` en `DATABASE_URL_UNPOOLED` aan. Je kunt dat nakijken in Settings → Environment Variables.

### 5.4 Foto-opslag koppelen (Vercel Blob)

1. Ga in je project naar **Storage → Create Database → Blob**.
2. Vul in:
   - **Name**: `meldingen-fotos`
   - **Access**: **Private**. Zo kan niemand de foto's zonder login bekijken.
   - **Regio**: Frankfurt
3. Klik op **Connect** en vink alle omgevingen aan.
4. `BLOB_READ_WRITE_TOKEN` wordt nu automatisch aangemaakt.

### 5.5 De overige omgevingsvariabelen invullen

Ga naar **Settings → Environment Variables** en voeg toe (zie hoofdstuk 3):

```
AUTH_SECRET                     (lange willekeurige tekst)
ENTRA_TENANT_ID                 (van IT)
AUTH_MICROSOFT_ENTRA_ID_ID      (van IT)
AUTH_MICROSOFT_ENTRA_ID_SECRET  (van IT)
ADMIN_EMAILS                    geert.demeulemeester@sintmichiel.be,stefan.verpoorten@sintmichiel.be
NOTIFY_EMAILS                   geert.demeulemeester@sintmichiel.be,stefan.verpoorten@sintmichiel.be
MAIL_FROM                       stefan.verpoorten@sintmichiel.be
MAIL_MODE                       test
APP_URL                         https://sintmichiel-meldingen.vercel.app
FORMULIER_URL                   https://sintmichiel-formulier.vercel.app   (enkel als je het gecombineerde formulier gebruikt)
```

> Een `AUTH_SECRET` maken zonder programmeerkennis: ga naar <https://generate-secret.vercel.app/32> en kopieer de tekst die je daar krijgt.

### 5.6 Opnieuw uitrollen

Ga naar **Deployments**, klik op **…** bij de laatste deployment en kies **Redeploy**.

Bij elke deployment gebeurt automatisch het volgende (via het script `vercel-build`):
- de databasetabellen worden aangemaakt of bijgewerkt (`prisma migrate deploy`);
- de app wordt gebouwd.

### 5.7 Testen

1. Open `https://<jouw-project>.vercel.app` op je gsm en dien een testaanvraag in.
2. Open `/beheer` en meld je aan met Microsoft. Bovenaan staat een gele balk "TESTMODUS".
3. Ga naar **Mails**. Je ziet dat de mails "gelogd (test)" zijn, maar niet echt verstuurd.
4. Werkt alles, en is de Entra-instelling van IT klaar? Zet dan `MAIL_MODE` op `live` en klik op **Redeploy**. De gele balk verdwijnt en de mails worden echt verstuurd.
5. Test opnieuw. Zet bv. je eigen testaanvraag op G en controleer of de mail aankomt.

### 5.8 Beveiliging van het formulier

- **Honeypot**: een onzichtbaar veld waaraan robots zich verraden. Dit werkt automatisch.
- **Rate limiting**: maximaal 5 aanvragen per 15 minuten per IP-adres. Dit is instelbaar via `RATE_LIMIT_MAX` en `RATE_LIMIT_WINDOW_MIN`. IP-adressen worden onleesbaar (gehasht) opgeslagen en na 24 uur gewist.
- **Bot-check**: Vercel BotID werkt automatisch op Vercel, zonder extra account of instelling. Lokaal wordt de check overgeslagen.
- **Foto's**:
  - Op de gsm worden foto's verkleind, en HEIC wordt omgezet naar JPG.
  - De server controleert daarna opnieuw het echte bestandstype, de grootte (max. 10 MB) en het aantal (max. 3).
  - Elke foto wordt opnieuw verkleind en bewaard zonder metadata, dus zonder GPS-locatie.

### 5.9 Over het Hobby-plan (gratis)

De app werkt op het Hobby-plan van Vercel. Volgens de voorwaarden van Vercel is dat plan bedoeld voor persoonlijk, niet-commercieel gebruik. Als Vercel daar ooit vragen over stelt, kun je overstappen op Pro. Aan de app hoeft dan niets te veranderen.

---

## 6. Lokaal opstarten (op je eigen computer)

Dit is alleen nodig als je de app zelf wilt aanpassen of testen.

**Wat je nodig hebt:**
- [Node.js](https://nodejs.org) versie 20 of hoger
- Een Postgres-database. Dat kan een lokale installatie zijn, of een gratis tweede database bij [Neon](https://neon.tech).

**Stappen:**

```bash
npm install
```

```bash
cp .env.example .env
```

Pas in `.env` minstens `DATABASE_URL`, `DATABASE_URL_UNPOOLED` en `AUTH_SECRET` aan.

```bash
npx prisma migrate dev
```

```bash
npm run db:seed
```

```bash
npm run dev
```

**Wat elk commando doet:**
- `npm install` installeert alle onderdelen.
- `npx prisma migrate dev` maakt de databasetabellen aan.
- `npm run db:seed` vult de database met testgegevens. Dit is optioneel.
- `npm run dev` start de app op <http://localhost:3000>.

**Aanmelden zonder Microsoft:** met `AUTH_DEV_LOGIN="true"` verschijnt er op `/aanmelden` een knop **Testlogin**. Daarmee meld je je aan met een adres uit `ADMIN_EMAILS`. Deze knop bestaat **nooit** op Vercel.

**Foto's lokaal:** zonder `BLOB_READ_WRITE_TOKEN` komen foto's in de map `.lokale-opslag`.

---

## 7. Testgegevens en testmodus

### Testgegevens (seed)

```bash
npm run db:seed
```

Dit commando maakt 11 testaanvragen en 3 testklusjesmannen aan. Daarbij zitten:
- actieve aanvragen, waarvan één met een mislukte mail, zodat je "Opnieuw versturen" kunt uitproberen;
- een NG-aanvraag;
- gearchiveerde aanvragen in twee schooljaren;
- foto's.

> ⚠️ De seed **wist eerst alle bestaande gegevens**. Gebruik hem nooit op de echte database. Op de productieomgeving van Vercel weigert het script, tenzij je `SEED_FORCE=true` zet. De echte lijst klusjesmannen start leeg.

### Testmodus voor mails

Met `MAIL_MODE=test` wordt geen enkele mail echt verstuurd:
- elke mail wordt opgeslagen met de status **"gelogd (test)"**;
- je ziet de mail in **Beheer → Mails**;
- in de logs van de server verschijnt een regel `📧 [TESTMODUS]`.

Bovenaan het beheer staat dan een gele balk. Zet `MAIL_MODE=live` om echt te versturen.

---

## 8. Onderhoud en veelgestelde vragen

**Gevaarlijke situaties**
Naast *Defect* en *Taak* bestaat de soort **Gevaarlijke situatie**. Wie die kiest, moet ook aanduiden of er **direct gevaar** is (ja/nee).
- In het overzicht staat een oranje label "Gevaarlijke situatie", en bij direct gevaar ook een rood label "⚠ direct gevaar".
- Je kunt filteren op de soort, en de Excel-export heeft een kolom "Direct gevaar".
- De mails gaan naar dezelfde personen als bij een defect of taak (`NOTIFY_EMAILS`). Bij direct gevaar staat "(DIRECT GEVAAR)" mee in het onderwerp, via het invulveld `{Soort}`.

**Het gecombineerde formulier (sintmichiel-formulier)**
Dat formulier laat eerst kiezen tussen taak, defect, gevaarlijke situatie en EHBO, en toont daarna het formulier van deze app (of van de EHBO-app) in een kader. De aanvragen komen gewoon hier binnen.
- Daarvoor moet `FORMULIER_URL` ingevuld zijn (hoofdstuk 3).
- Het formulier van deze app blijft daarnaast gewoon bruikbaar op zijn eigen adres.
- Met `?soort=DEFECT`, `?soort=TAAK` of `?soort=GEVAARLIJK` achter het adres is de soort meteen gekozen.

**Een beheerder toevoegen of verwijderen?**
Pas `ADMIN_EMAILS` aan in Vercel en klik op Redeploy. Gebruik je de instelling uit stap 4.5? Voeg de persoon dan ook toe bij "Users and groups" in Entra.

**Andere ontvangers voor nieuwe aanvragen?**
Pas `NOTIFY_EMAILS` aan en klik op Redeploy.

**Een campus toevoegen of hernoemen?**
Pas de lijst `CAMPUSSEN` aan in `src/lib/constanten.ts`.

**"Aanmelden is mislukt"?**
Kijk deze punten na:
- Is de Redirect URI in Entra exact `https://<jouw-project>.vercel.app/api/auth/callback/microsoft-entra-id`?
- Is het client secret niet vervallen?
- Staat je adres in `ADMIN_EMAILS`?

**Mails mislukken met "Access is denied" of "ErrorAccessDenied"?**
- Is admin consent gegeven voor `Mail.Send` (stap 4.4)?
- Is `MAIL_FROM` lid van de groep uit stap 4.6?
- Wacht tot een uur nadat je de policy hebt aangemaakt.

**Mails mislukken met "AADSTS7000215: Invalid client secret"?**
Het secret is fout of vervallen. Zie stap 4.3.

**Waar zie ik foutmeldingen van de server?**
In Vercel: open je project en ga naar **Logs**.

**Wie bewaart wat?**
- Aanvragen, historiek en het maillogboek staan in Neon (regio Frankfurt).
- Foto's staan privé in Vercel Blob.
- IP-adressen worden enkel gehasht bewaard en na 24 uur gewist.

### Technische opbouw (voor wie de code wil aanpassen)

```
prisma/schema.prisma        Datamodel (tabellen)
prisma/seed.ts              Testgegevens
src/app/page.tsx            Openbaar formulier (+ Meldingsformulier.tsx, fotoVerkleinen.ts)
src/app/api/aanvragen       Ontvangt het formulier (honeypot, BotID, rate limit, foto-controle)
src/app/api/foto/[id]       Toont foto's (enkel na login)
src/app/api/export          Excel-export
src/app/beheer/...          Overzicht, archief, niet uitgevoerd, klusjesmannen, mails, detail
src/app/beheer/acties.ts    Alle wijzigingen + historiek + statusmails
src/lib/mail.ts             Versturen via Microsoft Graph / testmodus
src/lib/mailTeksten.ts      Inhoud van de mails
src/auth.ts                 Login via Microsoft Entra ID
```

Technologie: Next.js 16 (App Router, TypeScript), Prisma 6, Auth.js v5, Vercel Blob, Vercel BotID, ExcelJS en sharp.
