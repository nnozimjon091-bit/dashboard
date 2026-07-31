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
| **Umumiy ko'rinish** | Daromad, xarajat, ROAS, CAC, lidlar, konversiya, auditoriya o'sishi, tagida operatorlar bo'limi |
| **Ijtimoiy tarmoq** | Instagram va Telegram: obunachilar, qamrov, faollik (ER) |
| **Reklama** | To'rt bo'lim: Umumiy, Meta Ads, Google Ads, Klinikalar katalogi |
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
| Kiruvchi operator | sana, kanal, qo'ng'iroqlar, javob berilgan, sotuvlar |
| Chiquvchi operator | sana, lidlar, bitimlar |
| Klinikalar katalogi | sana, katalog (Clinics.uz / Med24), lidlar, bitimlar, daromad, xarajat |

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

Klinikalar ROAS = daromad / xarajat
Klinikalar CPL  = xarajat / lidlar

Javob berish darajasi = javob berilgan / qo'ng'iroqlar
O'tkazib yuborilgan   = qo'ng'iroqlar − javob berilgan
Kiruvchidan sotuv %   = sotuvlar / javob berilgan
Chiquvchi konversiya  = bitimlar / lidlar
```

**Operatorlar bo'limi.** _Kiruvchi_ — asosiy raqamga kelgan qo'ng'iroqlar, kanal
kesimida. O'tkazib yuborilgan qo'ng'iroq alohida kiritilmaydi, jami va javob
berilgan orasidagi farqdan chiqadi. _Chiquvchi_ — operatorlar qilgan
qo'ng'iroqlarning natijasi, kunlik jami. Ikkalasi Umumiy ko'rinish sahifasining
oxirida alohida bo'lim bo'lib chiqadi.

**Klinikalar katalogi** (Reklama guruhi ichida). Clinics.uz va Med24 kabi
klinika kataloglaridan kelgan lidlar qo'lda kiritiladi. Sahifada "Barchasi /
Clinics.uz / Med24" filtri bor — filtrga qarab bitta yoki ikkita seriyali
grafik ko'rsatiladi.

Umumiy ko'rinish sahifasining oxirida ham alohida "Klinikalar katalogi"
bo'limi bor (Operatorlar bilan bir qatorda) — u har doim ikkala katalogni
birga ko'rsatadi.

Xarajat maydoni ikki xil mantiqqa ega:
- **Clinics.uz** — oylik obuna to'lovi, qo'lda kiritiladi.
- **Med24** — har lid uchun to'lov (standart $1). Kiritish formasida
  "Xarajat" maydonini **bo'sh qoldirsangiz**, lidlar soniga qarab avtomatik
  hisoblanadi. Narx o'zgarsa, maydonga qiymat kiritib qo'lda ham yozish mumkin.

## Google Ads hisobotini yuklash

Google Ads sahifasidagi **"Hisobot yuklash"** tugmasi orqali kampaniya
hisobotini to'g'ridan-to'g'ri yopishtirish mumkin — qo'lda kiritish shart emas.
Hammasi brauzerda o'qiladi, serverga hech narsa yuborilmaydi.

Google Ads → Kampaniyalar → jadvalni sarlavhasi va tepasidagi sana qatori
bilan birga nusxalang:

```
Отчет о кампании
30 июля 2026 г. - 30 июля 2026 г.
Статус кампании  Кампания   ...  Показы  Взаимодействия  ...  Расходы
Включено         Уролог1    ...  212     34              ...  8,94
Итого (Кампании) --         ...  1462    244             ...  81,69   ← tashlanadi
```

| Hisobotdagi ustun | Dashboardda |
|---|---|
| `Кампания` | kampaniya nomi |
| `Показы` | ko'rsatishlar |
| `Взаимодействия` (yoki `Клики`) | kliklar |
| `Расходы` | xarajat |
| `Конверсии` (bo'lsa) | lidlar |
| `День` (bo'lsa) | har qatorning o'z sanasi |

Parser ustunlarni **nomi bo'yicha** topadi — tartibi yoki soni o'zgarsa ham
ishlaydi. Rus formatidagi sonlar (`10,5`, `1 462`) va sanalar
(`30 июля 2026 г.`) tushuniladi. `Итого (...)` qatorlari tashlanadi, aks holda
xarajat ikki barobar chiqib ketardi. Ingliz tilidagi hisobot ham qabul
qilinadi.

Yozuvlar *sana + platforma + kampaniya* bo'yicha solishtiriladi: bitta
hisobotni ikki marta yuklasangiz takror yig'ilmaydi, mavjudi yangilanadi.

**Ikki narsaga e'tibor bering.** Hisobotda `Конверсии` ustuni bo'lmasa lidlar
nol bo'lib qoladi va CPL hisoblanmaydi — kerak bo'lsa uni Google Ads'da
ustunlar ro'yxatiga qo'shing. Va agar hisobot bir necha kunlik **jami** bo'lsa,
uni kunlarga bo'lib bo'lmaydi: hammasi oxirgi kunga yoziladi va ogohlantirish
chiqadi. Kunlik kesim uchun hisobotga `День` ustunini qo'shing.

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
  components/          UI va grafik komponentlari
  lib/
    types.ts           ma'lumot modellari
    google-ads.ts      Google Ads hisobotini o'qiydigan parser
    store.tsx          localStorage'ga bog'langan kontekst
    metrics.ts         sana, guruhlash va KPI hisoblari
    palette.ts         grafik ranglari (yorug'/qorong'i)
    format.ts          raqam va sana formatlari
    seed.ts            demo ma'lumot generatori
    export.ts          JSON/CSV eksport va import
```
