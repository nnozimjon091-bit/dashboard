# Marketing Dashboard

Marketing hisobotlarini kunlik yuritish va kuzatish uchun panel. Ma'lumot qo'lda
kiritiladi va **shu brauzerning `localStorage`ida** saqlanadi — server ham, login
ham, hech qanday API kalit ham kerak emas.

Valyuta: **USD**. Interfeys: **o'zbek tilida**. Yorug'/qorong'i rejim almashtirgich bilan.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:3000
```

Ishlab chiqarish uchun:

```bash
npm run build
npm run start
```

## Sahifalar

| Sahifa | Nima ko'rsatadi |
|---|---|
| **Umumiy ko'rinish** | Daromad, xarajat, ROAS, CAC, lidlar, konversiya, auditoriya o'sishi |
| **Ijtimoiy tarmoq** | Instagram va Telegram: obunachilar, qamrov, faollik (ER) |
| **Reklama** | Kampaniyalar kesimida byudjet, CTR, CPC, CPM, CPL |
| **Video** | YouTube va TikTok: ko'rishlar, obunachilar, ko'rish soatlari |
| **Sotuv va lidlar** | Lid → bitim yo'li, kanallarning daromadga hissasi |
| **Ma'lumot kiritish** | Kunlik ko'rsatkichlarni qo'shish va tahrirlash |
| **Sozlamalar** | Mavzu, zaxira nusxa (JSON), CSV eksport, demo/tozalash |

Yuqoridagi bitta filtr qatori (7 kun / 30 kun / 90 kun / Shu oy / Hammasi)
sahifadagi **barcha** grafiklarga birdek amal qiladi. Har bir ko'rsatkich
oldingi teng uzunlikdagi davr bilan solishtiriladi.

## Qanday ma'lumot kiritiladi

Har bir yozuv — **bitta kun + bitta kanal**. Shu sana va kanal uchun ikkinchi
marta kiritsangiz, yangi yozuv qo'shilmaydi — eskisi yangilanadi.

| Bo'lim | Maydonlar |
|---|---|
| Ijtimoiy tarmoq | sana, platforma, obunachilar (kun oxiriga), qamrov, faollik, postlar |
| Reklama | sana, platforma, kampaniya, xarajat, ko'rsatishlar, kliklar, lidlar |
| Video | sana, platforma, ko'rishlar, obunachilar (kun oxiriga), ko'rish soatlari, likelar |
| Sotuv | sana, kanal, lidlar, bitimlar, daromad |

**Muhim:** _Reklama_ bo'limidagi lid — faqat pullik reklamadan kelgan murojaat
(CPL shundan hisoblanadi). _Sotuv_ bo'limidagi lid — sotuv voronkasiga tushgan
barcha murojaat (konversiya shundan hisoblanadi). Ikkalasi bir-birini takrorlamaydi.

Obunachilar soni — **zaxira** ko'rsatkich: davr bo'yicha qo'shilmaydi, davr
oxiridagi qiymat olinadi, o'sish esa boshi va oxiri farqi sifatida chiqadi.

## Formulalar

```
CTR        = kliklar / ko'rsatishlar
CPC        = xarajat / kliklar
CPM        = xarajat / ko'rsatishlar × 1000
CPL        = xarajat / reklama lidlari
ER         = faollik / qamrov
Konversiya = bitimlar / lidlar
O'rt. chek = daromad / bitimlar
ROAS       = daromad / reklama xarajati
CAC        = reklama xarajati / bitimlar
Sof foyda  = daromad − reklama xarajati
```

## Ma'lumot xavfsizligi

Hamma narsa brauzerda turadi, shuning uchun:

- brauzer ma'lumotlarini tozalasangiz, yozuvlar ham o'chadi;
- boshqa qurilmada ochilganda ma'lumot ko'rinmaydi.

**Sozlamalar → Zaxira nusxa** bo'limidan vaqti-vaqti bilan JSON yuklab oling.
O'sha fayl orqali ma'lumotni istalgan qurilmada tiklash mumkin. Excel uchun
har bir bo'limni alohida CSV qilib ham yuklab olsa bo'ladi.

Birinchi ochilganda panel bo'sh turmasligi uchun demo ma'lumot ko'rsatiladi —
bu haqda yuqorida ogohlantiruvchi qator chiqadi va birinchi o'z yozuvingizni
kiritganingizda demo belgisi o'chadi.

## Google Sheets'dan reklama ma'lumotini olish

Targetolog to'ldiradigan jadvaldan kunlik sarf va lidlarni Reklama bo'limiga
olib kirish mumkin. Jadval **transponirlangan** ko'rinishda kutiladi: sanalar
ustun bo'lib yotadi, har bir soha uchun esa ko'rsatkichlar qator bo'lib
takrorlanadi.

```
 №  | Campaigns name | Metrics                         | ... | 1Jul2026 | 2Jul2026
 1  | Dermatolog     | Reach                           |     |          |
    |                | Lead soni (Result)              |     | 15       | 9
    |                | Lead narxi (CPL)                |     | $0.72    | $1.11
    |                | Sarflangan summa (Amount spent) |     | $10.73   | $9.99
    |                | Conversion rate %               |     |          |
```

Parser qator raqamlariga bog'lanmagan — ustun sarlavhalari (`Campaigns name`,
`Metrics`) va metrika nomlari bo'yicha topadi, shuning uchun jadvalga qator
qo'shilsa ham buzilmaydi.

| Jadvaldagi | Dashboardda |
|---|---|
| `Campaigns name` | kampaniya (soha) nomi |
| sanalar qatori | yozuv sanasi |
| `Lead soni (Result)` | lidlar |
| `Sarflangan summa (Amount spent)` | xarajat |
| nomida `(TG)` bor | platforma = Telegram, aks holda Meta |

Sanalar `1Jul2026`, `01.07.2026` va `2026-07-01` ko'rinishlarida tushuniladi.
Bo'sh kunlar uchun yozuv yaratilmaydi.

### Ikki yo'l

**1. Yopishtirish** — hech qanday sozlashsiz ishlaydi. Reklama sahifasida
"Yopishtirib olish" → jadvalni oching → `Ctrl+A` → `Ctrl+C` → oynaga `Ctrl+V`.
Ma'lumot serverga yuborilmaydi, hammasi brauzerda o'qiladi.

**2. Havoladan avtomatik** — jadvalni `File → Share → Publish to web` orqali
CSV qilib chiqaring va havolani `SHEETS_CSV_URL` o'zgaruvchisiga yozing
(`.env.example` ga qarang). Shundan keyin "Havoladan olish" tugmasi yetarli.
Sayt ochiq bo'lsa, `SHEETS_SYNC_PASSWORD` ni ham o'rnating.

Ikkala yo'l ham bitta parserdan foydalanadi. Yozuvlar *sana + platforma +
kampaniya* bo'yicha solishtiriladi: mavjudi yangilanadi, yangisi qo'shiladi —
qayta-qayta olsangiz ham takror yig'ilmaydi.

### Nimalar hisoblanmaydi

Jadvalda ko'rsatish (impressions) va klik yo'q, shuning uchun **CTR, CPC va
CPM** bo'sh qoladi. **CPL** esa jadvaldan olinmaydi — `xarajat ÷ lidlar`
formulasi bilan qayta hisoblanadi, chunki dashboard davrlar bo'yicha jamlaganda
o'rtacha CPL'ni to'g'ri chiqarishi kerak. Shu sababli u jadvaldagi qiymatdan
bir necha sentga farq qilishi mumkin.

## Texnologiyalar

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — ranglar CSS o'zgaruvchilari orqali, `data-theme` bilan almashadi
- Recharts — grafiklar
- Saqlash: `localStorage`

## Grafiklar bo'yicha qoidalar

Kod ichida quyidagilarga qat'iy amal qilingan:

- **Ikkinchi Y o'qi yo'q.** O'lchov birligi har xil bo'lsa (masalan xarajat va
  lidlar) — ikkita alohida grafik chiziladi.
- **Rang seriyaga biriktirilgan**, reytingga emas: Instagram qaysi grafikda
  bo'lmasin, doim bir xil rangda.
- Kategorik palitra rang ko'rligi (CVD) bo'yicha tekshirilgan; ikkala rejimda ham
  qo'shni ranglar orasidagi farq talab qilingan chegaradan yuqori.
- Har bir grafikning **jadval ko'rinishi** bor — ma'lumot faqat rang orqali
  uzatilmaydi. O'zgarish yo'nalishi rang bilan birga **strelka** bilan ham ko'rsatiladi.
- Ingichka belgilar, hairline to'r, har bir ko'rinishda bitta bosh raqam.

## Loyiha tuzilishi

```
src/
  app/                 sahifalar (App Router)
    api/sheets/        publish qilingan CSV'ni o'qiydigan route
  components/          UI va grafik komponentlari
  lib/
    types.ts           ma'lumot modellari
    sheet.ts           Google Sheets jadvalini o'qiydigan parser
    store.tsx          localStorage'ga bog'langan kontekst
    metrics.ts         sana, guruhlash va KPI hisoblari
    palette.ts         grafik ranglari (yorug'/qorong'i)
    format.ts          raqam va sana formatlari
    seed.ts            demo ma'lumot generatori
    export.ts          JSON/CSV eksport va import
```
