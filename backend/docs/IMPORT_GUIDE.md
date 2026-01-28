# Import Guide (Students, Teachers, Staff)

This guide explains how to use the import templates and which fields are required or optional for each module.

## General Notes

- Templates are XLSX files downloaded from the system.
- Import is row-based: one bad row will fail, but other rows still import.
- Email/phone must be unique among active users.
- Dates should be in `YYYY-MM-DD` format.
- Student class must already exist in the system.

## Student Import

### Required Fields

- fullName
- email
- phone
- rollNumber
- studentIemisCode
- classGrade (number, 1-12)
- classSection (e.g., A, B)
- dateOfBirth (YYYY-MM-DD)
- gender (Male | Female | Other)

### Optional Fields

- motherTongue
- disabilityType
- address
- primaryParentName
- primaryParentPhone
- primaryParentEmail
- primaryParentRelation
- secondaryParentName
- secondaryParentPhone
- secondaryParentEmail
- secondaryParentRelation

### Normalization

- classSection is uppercased (`a` becomes `A`).
- gender is normalized to `Male/Female/Other` (case-insensitive).
- motherTongue and disabilityType are normalized to enum codes (case-insensitive, so `nepali` and `Nepali` both work).
- XLSX hyperlink cells are converted to text.

### Allowed Values

Mother Tongue (use exact label):

- Nepali
- Maithili
- Bhojpuri
- Tharu
- Tamang
- Bajjika
- Avadhi
- Nepalbhasha (Newari)
- Magar Dhut
- Doteli
- Urdu
- Yakthung/ Limbu
- Gurung
- Magahi
- Baitadeli
- Rai
- Achhami
- Bantawa
- Rajbanshi
- Sherpa
- Khash
- Bajhangi
- Hindi
- Magar Kham
- Chamling
- Ranatharu
- Chepang
- Bajureli
- Santhali
- Danuwar
- Darchuleli
- Uranw/Urau
- Kulung
- Angika
- Majhi
- Sunuwar
- Thami
- Ganagai
- Thulung
- Bangla
- Ghale
- Sampang
- Marwadi
- Dadeldhuri
- Dhimal
- Tajpuriya
- Kumal
- Khaling
- Musalman
- Wambule
- Bahing/ Bayung
- Yakkha
- Sanskrit
- Bhujel
- Bhote
- Darai
- Yamphu/Yamphe
- Nachhiring
- Hyolmo/Yholmo
- Dumi
- Jumli
- Bote
- Mewahang
- Puma
- Pahari
- Athpahariya
- Dungmali
- Jirel
- Tibetan
- Dailekhi
- Chum/ Nubri
- Chhantyal
- Raji
- Thakali
- Meche
- Koyee
- Lohorung
- Kewarat
- Dolpali
- Done
- Mugali
- Jero/ Jerung
- Karmarong
- Chhintang
- Lhopa
- Lapcha
- Munda/Mudiyari
- Manange
- Chhiling
- Dura
- Tilung
- Sign Language
- Byansi
- Balkura/ Baram
- Baragunwa
- Sadri
- English
- Magar Kaike
- Sonaha
- Hayu/ Vayu
- Kisan
- Punjabi
- Dhuleli
- Khamchi (Raute)
- Lungkhim
- Lowa
- Kagate
- Waling/ Walung
- Nar-Phu
- Lhomi
- Tichhurong Poike
- Kurmali
- Koche
- Sindhi
- Phangduwali
- Belhare
- Surel
- Malpande
- Khariya
- Sadhani
- Hariyanwi
- Sam
- Bankariya
- Kusunda

Disability Type (use exact label):

- No Disability
- Physical
- Intellectual Disability
- Deaf
- Hard of Hearing
- Totally Blind
- Visually Impaired
- Low Vision
- Deafblindness
- Blind
- Vocal and Speech related
- Autism
- Mental / Psychosocial
- Hemophilia
- Multiple Disability
- Deaf and Blind
- N/A

### Prerequisites

- Class (`classGrade` + `classSection`) must already exist.

## Teacher Import

### Required Fields

- fullName
- email
- phone

### Optional Fields

- employeeId
- dateOfBirth (YYYY-MM-DD)
- gender (Male | Female | Other)
- joiningDate (YYYY-MM-DD)
- experienceYears (number string)
- highestQualification
- specialization
- designation
- department
- basicSalary (number string)
- allowances (number string)
- bankName
- bankAccountNumber
- bankBranch
- panNumber
- citizenshipNumber
- ssfNumber
- citNumber
- subjects (comma-separated subject codes)
- classes (comma-separated class sections, e.g., 10-A,11-B)

### Normalization

- subject codes are uppercased before lookup.
- class sections are uppercased (e.g., `10-a` -> `10-A`).

### Prerequisites

- Subject codes must already exist.
- Classes referenced in `classes` must already exist.

## Staff Import

### Required Fields

- fullName
- email
- phone

### Optional Fields

- dob (YYYY-MM-DD)
- gender (Male | Female | Other)
- emergencyContact
- basicSalary (number string)
- employeeId
- designation
- department

## Common Errors

- Invalid email format
- Missing required fields
- Class/Subject not found
- Duplicate email or phone (existing active user)
