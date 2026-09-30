# NSVS-E Ops

Interný **frontend demo** pre sťahovaciu firmu [NSVS-E](https://www.nsvs-e.sk): obhliadky v teréne → ocenenie / PDF → kalendár zákaziek → financie.

## Lokálne only

- **Žiadny** Supabase, Postgres, RLS ani reálna autentifikácia
- Stav v **Zustand** + persist do **`localStorage`** (`nsvs-e-ops-v1`)
- Médiá ako Base64 (s kompresiou / mockom pri veľkých súboroch)
- Prístup cez **role picker**: Terén / Majiteľ

## Spustenie

```bash
cd ~/nsvs-e-ops
npm install
npm run dev
```

Otvorte [http://localhost:3000](http://localhost:3000).

## Demo tok

1. **Terén** → Nová obhliadka → vyplňte formulár → **Odoslať na ocenenie**
2. **Majiteľ** → fronta **Na ocenenie** → otvorte detail (Epic 2: PDF)
3. **Kalendár** → 3 seed naplánované zákazky
4. **Financie** → dokončené zákazky

Dáta: Zustand + `localStorage` kľúč `nsvs-e-ops-v2`. **Obnoviť demo** resetuje seed.
