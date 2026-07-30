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

## Meta Ads integratsiyasi

Reklama bo'limidagi kunlik xarajat, ko'rsatish, klik va lidlarni Meta'dan
avtomatik tortib olish mumkin — qo'lda kiritish shart emas.

**Token brauzerga hech qachon yuborilmaydi.** Meta'ga murojaat faqat server
tomonidan (`/api/meta/sync`) qilinadi, token esa server muhit o'zgaruvchisida
turadi.

### 1. Meta tomonida tayyorgarlik

1. [developers.facebook.com](https://developers.facebook.com) da ilova yarating
   (turi: **Business**) va uni Business Manager'ingizga bog'lang.
2. **Business Settings → Users → System Users** bo'limida System User yarating.
3. Unga reklama hisobingizni **Assign Assets** orqali biriktiring
   (`View performance` yetarli).
4. **Generate New Token** → ilovani tanlang → **`ads_read`** ruxsatini belgilang.
   System User tokeni muddatsiz bo'ladi — dashboard uchun aynan shu kerak.
5. Reklama hisobi raqamini oling: Ads Manager URL'idagi `act=` qiymati yoki
   Business Settings → Ad Accounts.

> O'z biznesingizga tegishli hisob uchun App Review talab qilinmaydi.

### 2. O'zgaruvchilarni o'rnatish

Lokalda: `.env.example` faylini `.env.local` deb nusxalang va to'ldiring.
Vercel'da: **Project → Settings → Environment Variables**.

| O'zgaruvchi | Majburiy | Izoh |
|---|---|---|
| `META_ACCESS_TOKEN` | ha | System User tokeni |
| `META_AD_ACCOUNT_ID` | ha | `act_1234567890` yoki shunchaki raqam |
| `META_LEAD_ACTIONS` | yo'q | Qaysi action turi lid deb sanaladi. Standart: `lead` |
| `META_API_VERSION` | yo'q | Graph API versiyasi. Standart: `v23.0` |
| `META_SYNC_PASSWORD` | yo'q | Sinxronizatsiya endpointini paroll bilan yopadi |

Nomiga `NEXT_PUBLIC_` **qo'shmang** — u qiymatni brauzerga chiqarib yuboradi.

### 3. Ishlatish

Reklama sahifasidagi **"Meta'dan tortish"** tugmasi yuqoridagi davr filtri
bo'yicha ma'lumot oladi. Kelgan yozuvlar *sana + platforma + kampaniya*
bo'yicha solishtiriladi: mavjudi yangilanadi, yangisi qo'shiladi — takror
yig'ilib qolmaydi. Qo'lda kiritilgan Google/TikTok yozuvlariga tegilmaydi.

### Lidlar to'g'ri sanalmasa

Meta lidni kampaniya turiga qarab har xil `action_type` bilan qaytaradi.
Sinxronizatsiyadan keyin karta ichida **"Meta qaytargan action turlari"**
ro'yxati ochiladi — u yerda haqiqiy raqamlarni ko'rib, kerakligini
`META_LEAD_ACTIONS` ga yozing. Ko'p uchraydiganlari:

| Kampaniya turi | action_type |
|---|---|
| Lead Ads (Meta formasi) | `lead` |
| Saytdagi piksel | `offsite_conversion.fb_pixel_lead` |
| Messenger'ga yozish | `onsite_conversion.messaging_conversation_started_7d` |

Bir nechtasini vergul bilan yozsa ham bo'ladi, lekin ehtiyot bo'ling —
ba'zi turlar bir xil konversiyani ikki marta sanaydi.

### Xavfsizlik

Meta ulangach, `/api/meta/sync` endpointi reklama raqamlaringizni qaytara
boshlaydi. Sayt ochiq bo'lsa, URL'ni bilgan odam ularni ko'ra oladi. Shuning
uchun kamida bittasini qiling:

- **Vercel → Settings → Deployment Protection** ni yoqing (butun saytni yopadi), yoki
- `META_SYNC_PASSWORD` o'rnating — sinxronizatsiya tugmasi parol so'raydi.

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
    api/meta/          Meta Ads server route'lari (token faqat shu yerda)
  components/          UI va grafik komponentlari
  lib/
    types.ts           ma'lumot modellari
    meta.ts            Meta Marketing API mijozi (server tomonida)
    store.tsx          localStorage'ga bog'langan kontekst
    metrics.ts         sana, guruhlash va KPI hisoblari
    palette.ts         grafik ranglari (yorug'/qorong'i)
    format.ts          raqam va sana formatlari
    seed.ts            demo ma'lumot generatori
    export.ts          JSON/CSV eksport va import
```
