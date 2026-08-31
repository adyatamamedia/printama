# ATURAN AI AGENT DALAM MENGELOLA GITHUB PROJECT

Dokumen ini merupakan aturan wajib bagi seluruh AI Agent yang bekerja pada repository project.

Tujuan utama aturan ini adalah:

- Menjaga source code project tetap aman.
- Menjaga histori Git tetap bersih dan mudah dilacak.
- Mencegah kehilangan pekerjaan.
- Mencegah AI Agent melakukan perubahan berbahaya pada repository.
- Memastikan setiap perubahan dapat di-rollback.
- Memudahkan developer melanjutkan pekerjaan dari perangkat atau agent lain.

---

# 1. PRINSIP UTAMA

AI Agent wajib memperlakukan repository Git sebagai **sumber utama histori project**.

AI Agent harus selalu:

1. Memeriksa kondisi repository sebelum bekerja.
2. Memahami perubahan yang sudah ada sebelum membuat perubahan baru.
3. Tidak menghapus pekerjaan developer atau agent lain.
4. Membuat perubahan secara bertahap dan terkontrol.
5. Melakukan validasi sebelum commit.
6. Menulis commit message yang menjelaskan perubahan.
7. Menghindari tindakan Git destruktif.
8. Menjaga credential dan data sensitif agar tidak masuk repository.

---

# 2. PEMERIKSAAN AWAL SEBELUM BEKERJA

Sebelum mengubah source code, jalankan:

```bash
git status
```

Kemudian periksa:

```bash
git branch
```

dan bila diperlukan:

```bash
git log --oneline -10
```

AI Agent harus memahami:

- branch yang sedang aktif,
- apakah terdapat perubahan yang belum di-commit,
- apakah terdapat file baru,
- commit terakhir,
- apakah repository sedang berada dalam proses merge atau rebase.

Jika terdapat perubahan yang dibuat developer sebelumnya, **jangan langsung menghapus atau menimpanya**.

---

# 3. JANGAN MENGHAPUS PEKERJAAN YANG SUDAH ADA

AI Agent DILARANG menggunakan perintah seperti:

```bash
git reset --hard
```

```bash
git clean -fd
```

```bash
git checkout .
```

```bash
git restore .
```

tanpa instruksi eksplisit dari developer.

Perintah tersebut dapat menghapus pekerjaan yang belum di-commit.

Jika ditemukan perubahan yang tidak dibuat oleh AI Agent, AI Agent harus menganggap perubahan tersebut sebagai **pekerjaan penting milik developer atau agent lain**.

---

# 4. JANGAN FORCE PUSH

AI Agent DILARANG melakukan:

```bash
git push --force
```

atau:

```bash
git push -f
```

secara otomatis.

Force push hanya boleh dilakukan jika developer secara eksplisit memerintahkannya.

AI Agent juga tidak boleh melakukan:

```bash
git push --force-with-lease
```

tanpa alasan yang jelas dan izin developer.

---

# 5. BRANCH UTAMA HARUS DIJAGA

Branch utama biasanya:

```text
main
```

atau:

```text
master
```

AI Agent tidak boleh sembarangan:

- menghapus branch utama,
- mengganti histori branch utama,
- melakukan rebase branch utama,
- melakukan reset branch utama ke commit lama.

Branch utama harus selalu dianggap sebagai branch stabil.

---

# 6. STRATEGI BRANCH

Untuk perubahan kecil dan development lokal yang memang diizinkan developer, AI Agent dapat bekerja pada branch aktif.

Untuk fitur besar, dianjurkan membuat branch khusus.

Format:

```text
feature/nama-fitur
```

Contoh:

```text
feature/auth-google
feature/payment-gateway
feature/admin-dashboard
```

Untuk perbaikan bug:

```text
fix/nama-bug
```

Contoh:

```text
fix/login-redirect
fix/mobile-navbar
fix/api-validation
```

Untuk refactor:

```text
refactor/nama-bagian
```

Contoh:

```text
refactor/user-service
```

Untuk dokumentasi:

```text
docs/nama-dokumentasi
```

---

# 7. JANGAN MEMBUAT BRANCH BERLEBIHAN

AI Agent tidak perlu membuat branch untuk setiap perubahan kecil.

Contoh perubahan kecil:

- typo,
- perubahan padding,
- perubahan warna,
- perubahan satu konfigurasi sederhana,
- perbaikan dokumentasi kecil.

Gunakan branch baru terutama untuk:

- fitur baru,
- perubahan arsitektur,
- migrasi database,
- refactor besar,
- perubahan authentication,
- integrasi API,
- perubahan yang berisiko merusak project.

---

# 8. UPDATE REPOSITORY SEBELUM MELAKUKAN PUSH

Sebelum melakukan push, AI Agent harus memastikan repository tidak tertinggal dari remote.

Periksa:

```bash
git fetch
```

Kemudian:

```bash
git status
```

Jika diperlukan:

```bash
git pull
```

Namun jangan melakukan `git pull` secara buta apabila terdapat banyak perubahan lokal.

Periksa terlebih dahulu apakah terdapat kemungkinan konflik.

---

# 9. JANGAN OTOMATIS MENYELESAIKAN KONFLIK DENGAN MENGHAPUS SALAH SATU VERSI

Jika terjadi merge conflict seperti:

```text
<<<<<<< HEAD
...
=======
...
>>>>>>> branch
```

AI Agent harus memahami kedua perubahan terlebih dahulu.

Jangan langsung memilih:

```text
ours
```

atau:

```text
theirs
```

untuk seluruh project.

Penyelesaian konflik harus mempertahankan fungsi dari kedua perubahan bila memungkinkan.

---

# 10. COMMIT HARUS ATOMIK

Satu commit sebaiknya berisi satu perubahan logis.

Jangan mencampurkan:

- fitur baru,
- refactor besar,
- formatting,
- migration database,
- bug fix,

dalam satu commit jika sebenarnya dapat dipisahkan.

Contoh yang baik:

```text
feat: add user registration API
```

kemudian:

```text
feat: add registration form
```

kemudian:

```text
fix: validate duplicate email registration
```

---

# 11. FORMAT COMMIT MESSAGE

Gunakan format:

```text
type: description
```

Jenis commit yang dianjurkan:

```text
feat:
fix:
refactor:
docs:
style:
test:
chore:
perf:
build:
ci:
```

Contoh:

```text
feat: add article category management
```

```text
fix: resolve login redirect loop
```

```text
refactor: simplify media upload service
```

```text
docs: add local development guide
```

```text
chore: update npm dependencies
```

Hindari commit message seperti:

```text
update
```

```text
fix
```

```text
done
```

```text
test
```

```text
perubahan
```

```text
update terbaru
```

Commit message harus menjelaskan **apa yang berubah**.

---

# 12. JANGAN COMMIT SOURCE CODE YANG BELUM DIPERIKSA

Sebelum commit, periksa:

```bash
git status
```

Kemudian:

```bash
git diff
```

Jika file sudah masuk staging:

```bash
git diff --cached
```

AI Agent wajib memastikan tidak ada:

- file debugging,
- credential,
- password,
- API key,
- file sementara,
- log besar,
- file hasil build yang tidak diperlukan,
- file database lokal.

---

# 13. JANGAN GUNAKAN `git add .` SECARA BUTA

Sebelum menggunakan:

```bash
git add .
```

AI Agent harus memeriksa:

```bash
git status
```

Pastikan semua file memang relevan.

Untuk perubahan sensitif lebih aman menggunakan:

```bash
git add path/to/file
```

atau beberapa file tertentu.

---

# 14. DILARANG COMMIT SECRET

File berikut tidak boleh masuk repository apabila berisi data sebenarnya:

```text
.env
.env.local
.env.production
.env.development.local
credentials.json
service-account.json
private.key
*.pem
*.key
```

Jangan commit:

- database password,
- SMTP password,
- API key,
- OpenAI API key,
- OpenRouter API key,
- Google OAuth secret,
- GitHub token,
- Cloudflare token,
- payment gateway secret,
- private SSH key.

Gunakan:

```text
.env.example
```

untuk contoh konfigurasi.

Contoh:

```env
DB_HOST=127.0.0.1
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```

---

# 15. PERIKSA `.gitignore`

AI Agent harus memastikan file berikut tidak ikut Git apabila tidak diperlukan:

```text
node_modules/
vendor/
.env
.env.*
storage/logs/*
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
```

Namun jangan menambahkan aturan `.gitignore` sembarangan jika file tersebut memang diperlukan oleh project.

---

# 16. JANGAN COMMIT DEPENDENCY DIRECTORY

Secara umum jangan commit:

```text
node_modules/
```

Untuk PHP Composer biasanya jangan commit:

```text
vendor/
```

Dependency harus direkonstruksi melalui:

```bash
npm install
```

atau:

```bash
composer install
```

Pastikan file lock tetap disimpan bila digunakan project:

```text
package-lock.json
composer.lock
```

---

# 17. VALIDASI SEBELUM COMMIT

AI Agent wajib melakukan validasi sesuai stack project.

## JavaScript / React / Next.js

Jika tersedia:

```bash
npm run lint
```

```bash
npm run build
```

atau:

```bash
npm test
```

## Laravel

Jika tersedia:

```bash
php artisan test
```

atau:

```bash
vendor/bin/phpunit
```

Periksa route jika relevan:

```bash
php artisan route:list
```

## CodeIgniter

Jika test tersedia:

```bash
vendor/bin/phpunit
```

AI Agent tidak harus menjalankan semua command apabila environment tidak mendukungnya.

Jika validasi gagal karena environment, laporkan penyebabnya dan jangan menyembunyikan error.

---

# 18. JANGAN MEMPERBAIKI ERROR TEST DENGAN MENGHAPUS TEST

Jika test gagal, AI Agent DILARANG:

- menghapus test,
- menonaktifkan test,
- memberi skip pada test,
- mengubah assertion agar selalu berhasil,

hanya supaya build terlihat berhasil.

Perbaiki penyebab sebenarnya.

---

# 19. DATABASE MIGRATION

Untuk perubahan struktur database gunakan migration jika framework mendukungnya.

Jangan mengandalkan perubahan manual database saja.

Contoh Laravel:

```bash
php artisan make:migration ...
```

Migration harus dapat:

```bash
php artisan migrate
```

dan jika memungkinkan:

```bash
php artisan migrate:rollback
```

Jangan menghapus data production melalui migration tanpa instruksi eksplisit.

---

# 20. PERUBAHAN BERISIKO TINGGI

AI Agent harus ekstra hati-hati jika mengubah:

```text
authentication
authorization
middleware
database migrations
payment
deployment
CI/CD
server configuration
environment variables
storage
file upload
API authentication
user permissions
```

Untuk perubahan tersebut, lakukan pemeriksaan tambahan sebelum commit.

---

# 21. JANGAN MENGUBAH FILE YANG TIDAK BERHUBUNGAN

Jika tugas hanya:

> Perbaiki navbar mobile

maka AI Agent tidak boleh sekaligus:

- refactor authentication,
- mengganti struktur database,
- mengubah seluruh CSS,
- meng-upgrade framework,
- mengganti dependency besar.

Perubahan harus tetap fokus pada tugas.

---

# 22. JANGAN MELAKUKAN MASS FORMATTING TANPA ALASAN

AI Agent tidak boleh melakukan formatting seluruh project hanya karena mengedit satu file.

Mass formatting membuat:

```bash
git diff
```

sulit diperiksa.

Format hanya file yang memang sedang dikerjakan kecuali developer meminta formatting project.

---

# 23. DEPENDENCY BARU

Sebelum menambahkan dependency baru, pastikan dependency tersebut benar-benar dibutuhkan.

Jangan menginstall library untuk fungsi sederhana yang dapat dilakukan oleh stack yang sudah ada.

Jika menambah dependency:

```bash
npm install package-name
```

atau:

```bash
composer require package/name
```

pastikan lock file ikut diperbarui.

---

# 24. JANGAN SEMBARANGAN UPGRADE DEPENDENCY

AI Agent tidak boleh otomatis menjalankan:

```bash
npm update
```

atau:

```bash
composer update
```

untuk seluruh project kecuali memang diperlukan.

Upgrade dependency dapat menyebabkan breaking change.

Lebih aman memperbarui package yang diperlukan saja.

---

# 25. PUSH KE GITHUB

Sebelum push:

```bash
git status
```

Pastikan working tree sesuai.

Kemudian:

```bash
git log --oneline -5
```

Pastikan commit terakhir benar.

Setelah itu baru:

```bash
git push
```

atau jika branch baru:

```bash
git push -u origin nama-branch
```

---

# 26. JANGAN PUSH JIKA PROJECT JELAS-JELAS RUSAK

Jangan melakukan push jika diketahui:

- syntax error,
- build gagal karena source code,
- aplikasi crash,
- migration invalid,
- import/module hilang,
- route utama rusak.

Perbaiki terlebih dahulu atau jelaskan kepada developer apabila masalah tidak dapat diselesaikan.

---

# 27. TAG RELEASE

AI Agent tidak boleh membuat tag release sembarangan.

Format release dapat menggunakan Semantic Versioning:

```text
v1.0.0
v1.1.0
v1.1.1
```

Interpretasi:

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
v1.0.0
```

release pertama.

```text
v1.1.0
```

fitur baru yang backward compatible.

```text
v1.1.1
```

bug fix.

Tag release hanya dibuat jika memang ada instruksi atau workflow release project.

---

# 28. GITHUB ISSUE

Jika repository menggunakan GitHub Issues, issue dapat digunakan untuk:

- bug,
- fitur baru,
- improvement,
- technical debt,
- deployment issue.

Contoh judul:

```text
[BUG] Login redirect loop after authentication
```

```text
[FEATURE] Add article category management
```

```text
[IMPROVEMENT] Optimize dashboard query
```

---

# 29. PULL REQUEST

Jika menggunakan workflow Pull Request, PR harus menjelaskan:

```markdown
## Summary

Menambahkan fitur manajemen kategori artikel.

## Changes

- Add categories table
- Add Category model
- Add admin CRUD
- Add API endpoint
- Add validation

## Testing

- CRUD category tested
- API tested
- Duplicate category validation tested

## Notes

Database migration required.
```

---

# 30. JANGAN MERGE PR YANG MASIH BERMASALAH

Sebelum merge:

- pastikan tidak ada conflict,
- pastikan test berhasil,
- pastikan build berhasil,
- periksa perubahan database,
- periksa file konfigurasi,
- periksa secret.

---

# 31. README HARUS DIJAGA

Jika perubahan besar mempengaruhi cara menjalankan aplikasi, update:

```text
README.md
```

Misalnya jika ada:

- dependency baru,
- environment variable baru,
- setup database baru,
- command development baru,
- service tambahan.

---

# 32. `.env.example` HARUS IKUT DIPERBARUI

Jika source code menggunakan environment variable baru:

```env
OPENROUTER_API_KEY=
```

maka tambahkan juga pada:

```text
.env.example
```

tetapi jangan pernah memasukkan API key sebenarnya.

---

# 33. CHANGELOG

Jika project menggunakan:

```text
CHANGELOG.md
```

AI Agent harus memperbaruinya untuk perubahan penting.

Contoh:

```markdown
## Unreleased

### Added

- Article category management
- Category API endpoints

### Fixed

- Login redirect loop
```

---

# 34. BACKUP SEBELUM OPERASI BERISIKO

Sebelum perubahan besar, AI Agent disarankan memastikan kondisi saat ini sudah memiliki commit.

Contoh:

```bash
git status
```

Jika terdapat pekerjaan penting yang belum tersimpan, jangan melakukan operasi Git berisiko.

---

# 35. JANGAN REWRITE HISTORY SEMBARANGAN

AI Agent tidak boleh otomatis menggunakan:

```bash
git rebase -i
```

```bash
git commit --amend
```

```bash
git reset --hard HEAD~1
```

```bash
git filter-branch
```

atau tool rewrite history lainnya.

Histori Git yang sudah di-push harus dianggap permanen kecuali developer secara eksplisit meminta perubahan.

---

# 36. JANGAN MENGHAPUS BRANCH TANPA IZIN

Jangan otomatis menjalankan:

```bash
git branch -D nama-branch
```

atau:

```bash
git push origin --delete nama-branch
```

kecuali branch jelas sudah tidak diperlukan atau developer memberikan instruksi.

---

# 37. JIKA TERJADI KESALAHAN

Jika AI Agent membuat kesalahan yang sudah di-commit, utamakan:

```bash
git revert
```

daripada rewrite history.

Contoh:

```bash
git revert COMMIT_HASH
```

Pendekatan ini lebih aman karena histori tetap tercatat.

---

# 38. JIKA TERDAPAT PERUBAHAN YANG TIDAK DIKENALI

Apabila:

```bash
git status
```

menampilkan perubahan yang tidak dibuat AI Agent, jangan langsung membuangnya.

Kemungkinan perubahan berasal dari:

- developer,
- agent AI lain,
- IDE,
- proses build,
- dependency manager.

Periksa dulu sebelum mengambil tindakan.

---

# 39. MULTI AI AGENT

Jika beberapa AI Agent bekerja pada repository yang sama:

- jangan saling menghapus perubahan,
- jangan melakukan reset repository,
- gunakan commit kecil,
- gunakan branch bila pekerjaan berbeda,
- selalu periksa `git status`,
- selalu periksa commit terbaru sebelum push.

Anggap setiap perubahan asing sebagai pekerjaan yang harus dipertahankan sampai terbukti sebaliknya.

---

# 40. WORKFLOW STANDAR AI AGENT

Workflow default:

```bash
git status
```

↓

Pahami tugas.

↓

Periksa file terkait.

↓

Lakukan perubahan.

↓

Jalankan test/lint/build yang relevan.

↓

```bash
git diff
```

↓

Periksa perubahan.

↓

```bash
git status
```

↓

Stage file yang relevan.

```bash
git add path/to/file
```

↓

Commit.

```bash
git commit -m "feat: add example feature"
```

↓

Periksa kembali:

```bash
git status
```

↓

Jika diminta atau workflow mengharuskan:

```bash
git push
```

---

# 41. WORKFLOW FITUR BESAR

Untuk fitur besar:

```bash
git fetch
```

```bash
git status
```

Buat branch:

```bash
git checkout -b feature/nama-fitur
```

Implementasi fitur.

Jalankan test.

Periksa:

```bash
git diff
```

Commit bertahap:

```bash
git add ...
git commit -m "feat: ..."
```

Kemudian:

```bash
git push -u origin feature/nama-fitur
```

Setelah itu fitur dapat melalui Pull Request.

---

# 42. AI AGENT TIDAK BOLEH ASAL PUSH

Keberhasilan tugas tidak diukur hanya dari:

```text
git push berhasil
```

Keberhasilan tugas berarti:

```text
source code benar
+
fitur berjalan
+
tidak merusak fitur lama
+
repository bersih
+
commit dapat dipahami
+
tidak ada secret
+
perubahan dapat dilacak
```

---

# 43. PERINTAH BERBAHAYA

Perintah berikut dianggap **HIGH RISK**:

```bash
git reset --hard
git clean -fd
git push --force
git push -f
git rebase -i
git branch -D
git checkout .
git restore .
git filter-branch
```

AI Agent **DILARANG menjalankan perintah tersebut secara otomatis**.

Jika benar-benar diperlukan, jelaskan terlebih dahulu konsekuensinya.

---

# 44. PERINTAH YANG AMAN UNTUK INSPEKSI

AI Agent bebas menggunakan:

```bash
git status
```

```bash
git diff
```

```bash
git diff --cached
```

```bash
git log
```

```bash
git log --oneline
```

```bash
git branch
```

```bash
git remote -v
```

```bash
git fetch
```

```bash
git show
```

karena umumnya tidak mengubah source code atau histori Git.

---

# 45. LAPORAN SETELAH PEKERJAAN

Setelah menyelesaikan pekerjaan, AI Agent harus memberikan ringkasan minimal:

```text
Perubahan:
- Menambahkan ...
- Memperbaiki ...
- Mengubah ...

Validasi:
- npm run lint: berhasil
- npm run build: berhasil

Git:
- Branch: feature/example
- Commit: abc1234
- Commit message: feat: add example feature
```

Jika belum melakukan commit:

```text
Git:
- Perubahan masih berada di working tree.
- Belum dilakukan commit.
```

Jika belum push:

```text
Git:
- Commit sudah dibuat.
- Belum dilakukan push ke remote.
```

Jangan mengatakan sudah melakukan commit atau push jika perintah tersebut belum benar-benar berhasil.

---

# 46. ATURAN KHUSUS UNTUK AI AGENT

AI Agent harus memprioritaskan:

```text
KEAMANAN
>
KEBENARAN SOURCE CODE
>
KOMPATIBILITAS
>
HISTORI GIT
>
KECEPATAN
```

Jangan mengorbankan keamanan repository hanya untuk menyelesaikan tugas lebih cepat.

---

# 47. LARANGAN UTAMA

AI Agent DILARANG:

- menghapus source code tanpa memahami fungsinya,
- menghapus perubahan developer,
- menghapus database production,
- commit secret,
- force push,
- reset hard,
- menghapus branch sembarangan,
- rewrite Git history sembarangan,
- mengubah konfigurasi production tanpa instruksi,
- mematikan test supaya build berhasil,
- melakukan upgrade dependency besar tanpa alasan,
- melakukan refactor di luar scope,
- push source code yang diketahui rusak.

---

# 48. DEFAULT DECISION RULE

Jika AI Agent ragu memilih antara tindakan Git yang:

```text
lebih cepat tetapi berisiko
```

dan:

```text
lebih lambat tetapi aman
```

selalu pilih tindakan yang **aman dan reversible**.

---

# 49. SOURCE OF TRUTH

Urutan sumber kebenaran project:

```text
1. Instruksi developer
2. Source code repository saat ini
3. Dokumentasi project
4. Database migration/schema
5. Test
6. Git history
7. Asumsi AI Agent
```

AI Agent tidak boleh mengganti implementasi yang sudah ada hanya berdasarkan asumsi.

---

# 50. GOLDEN RULE

> Jangan pernah melakukan tindakan Git yang dapat menyebabkan pekerjaan developer hilang apabila terdapat alternatif yang lebih aman.

Setiap perubahan harus:

```text
TRACEABLE
REVERSIBLE
TESTABLE
MINIMAL
SECURE
```

Dengan mengikuti aturan ini, GitHub digunakan bukan hanya sebagai tempat menyimpan source code, tetapi sebagai **sistem kontrol perubahan dan pengaman utama seluruh project**.