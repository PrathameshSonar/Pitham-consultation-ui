# SPBSP, Ahilyanagar — QA Test Plan

> Last updated: 2026-04-25
> Covers every user-facing functionality + role-specific permissions + edge cases.
> **P1** = must pass before release · **P2** = should pass · **P3** = nice-to-have / edge cases

---

## 0. Setup before testing

### Test environments

| Env | Frontend | Backend | DB |
|---|---|---|---|
| **Local dev** | `npm run dev` → `http://localhost:3000` | `uvicorn main:app --reload` → `http://localhost:8000` | local SQLite or MySQL |
| **Staging** | `https://pitham-consultation-ui.vercel.app` | `https://pitham-consultation-api.onrender.com` | Supabase / Neon Postgres |

### Test accounts to create before starting

| Role | How to provision | Notes |
|---|---|---|
| **Super Admin** | Update DB directly: `UPDATE users SET role='admin' WHERE id=1;` | Cannot self-demote |
| **Moderator** | Use super-admin → Settings → Moderators → Promote | Max 5 active at any time |
| **Regular user A** | Register normally via UI | For booking, querying, broadcasts |
| **Regular user B** | Register normally via UI | For testing user-list bulk actions |
| **Regular user C** | Register via Google Sign-In | For OAuth path |

### Browsers to test
Chrome (latest), Safari (latest, iOS), Firefox (latest). Edge optional.

### Devices
- Desktop: 1920×1080
- Tablet: iPad / 768px
- Mobile: iPhone SE / 375px AND iPhone 14 / 390px

---

## 1. Public site (no login required)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| PUB-01 | Home page loads | Visit `/` | Hero, features, services, CTA all render | P1 |
| PUB-02 | Brand link goes home | Click logo/brand text from any public page | Lands on `/` | P1 |
| PUB-03 | Public navbar — desktop | Resize to ≥900px on `/` | Inline nav: Pitham · About · Contact + Lang + Login + Register | P1 |
| PUB-04 | Public navbar — mobile | Resize to <900px on `/` | Brand on left, hamburger ☰ on right | P1 |
| PUB-05 | Mobile hamburger | Tap hamburger | Drawer slides from right with: Pitham, About, Contact, Login, Register, Language picker | P1 |
| PUB-06 | Mobile drawer auto-close | Tap any link in drawer | Drawer closes + navigates | P1 |
| PUB-07 | Pitham page loads | Visit `/pitham` | Header band (name + Ahilyanagar location), banner carousel, About, Deity, Featured Events, Upcoming Events, Testimonials, Videos, Gallery, Instagram, Contact | P1 |
| PUB-08 | Banner carousel | On `/pitham` with multiple banners | Auto-advances every 6s, prev/next arrows work, dots clickable | P2 |
| PUB-09 | Banner caption visible | On each banner with title | Caption shown at bottom on dark gradient overlay | P2 |
| PUB-10 | Featured event highlight | On `/pitham` with featured events | Gold-bordered cards with "Featured" badge | P2 |
| PUB-11 | Event card "Know More" | Click Know More on any event card | Navigates to `/pitham/events/{id}` showing full details | P1 |
| PUB-12 | Event detail Register button | Click Register on event detail page | Snackbar shows "Registration will open soon" | P3 |
| PUB-13 | Gallery lightbox | Click any gallery image | Full-screen lightbox opens; ←/→/Esc keys work | P2 |
| PUB-14 | Video card opens YouTube | Click any video card | Opens YouTube link in new tab | P2 |
| PUB-15 | Instagram embed | View Instagram section | Embedded iframe shows the post | P3 |
| PUB-16 | About page loads | Visit `/about` | Renders | P1 |
| PUB-17 | Contact page | Visit `/contact` | Email, phone, address, social links, WhatsApp button if configured | P1 |
| PUB-18 | WhatsApp deep link | Click WhatsApp button on Contact | Opens `wa.me/<number>` | P2 |
| PUB-19 | Terms page | Visit `/terms` | All 14 sections render, brand name correct (SPBSP, Ahilyanagar) | P2 |
| PUB-20 | Privacy page | Visit `/privacy` | Renders without errors | P2 |
| PUB-21 | Language switch | Click language button → select Hindi → reload | All UI text in Hindi (हिन्दी), persists across navigation | P1 |
| PUB-22 | Language switch — Marathi | Same as above with Marathi | All UI in Marathi | P1 |
| PUB-23 | Cookie consent | First visit | Cookie banner appears at bottom, "Accept" dismisses | P2 |
| PUB-24 | Page metadata | View page source on `/pitham` | `<title>` shows "Shri Pitambara Baglamukhi Shakti Pitham..." | P3 |
| PUB-25 | Favicon | Check browser tab | SPBSP logo, not Next.js default | P3 |

---

## 2. Authentication

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| AUTH-01 | Register with email | Fill all fields, accept terms, submit | Account created, redirected to dashboard | P1 |
| AUTH-02 | Register with mobile only | Email blank, mobile filled | Account created | P1 |
| AUTH-03 | Register name accepts letters only | Type `John123!@` in name field | Only `John` appears (digits + special chars stripped) | P2 |
| AUTH-04 | Register Devanagari name | Type `राम` in name | Accepted (Unicode letters allowed) | P2 |
| AUTH-05 | Register without email or mobile | Both blank, submit | Backend rejects with 400 "Email or mobile is required" | P2 |
| AUTH-06 | Register short password | Password = `12345` | Rejected: minimum 6 characters | P1 |
| AUTH-07 | Register duplicate email | Same email twice | "Email already registered" | P1 |
| AUTH-08 | Register duplicate mobile | Same mobile twice | "Mobile number already registered" | P1 |
| AUTH-09 | Register without accepting terms | Terms checkbox unchecked | Submit blocked client-side | P2 |
| AUTH-10 | Captcha verification | Standard register flow | reCAPTCHA must be completed | P2 |
| AUTH-11 | Login with email | Email + password | Successful, lands on dashboard | P1 |
| AUTH-12 | Login with mobile | Mobile + password | Successful | P1 |
| AUTH-13 | Login wrong password | Correct email, wrong pwd | "Invalid credentials" | P1 |
| AUTH-14 | Login non-existent user | Random email, any password | "Invalid credentials" (no user enumeration) | P2 |
| AUTH-15 | Login rate limit | 16 failed logins in 60s | 429 Too Many Requests | P2 |
| AUTH-16 | Google Sign-In (new user) | Click "Sign in with Google" | Account auto-created with Google profile | P1 |
| AUTH-17 | Google Sign-In (existing user) | Re-click for existing | Logged in, no duplicate user | P1 |
| AUTH-18 | Forgot password — request OTP | Visit `/forgot-password` → submit email | "If account exists, link sent" message | P1 |
| AUTH-19 | OTP delivery — email | Check email inbox | 6-digit OTP received with "valid 10 min" notice | P1 |
| AUTH-20 | OTP delivery — WhatsApp | If WhatsApp configured + user has mobile | Same OTP via WhatsApp | P2 |
| AUTH-21 | Reset with OTP | Enter 6-digit OTP + new password | Password reset, can login | P1 |
| AUTH-22 | Reset with wrong OTP | Random 6 digits | "Invalid or expired OTP" | P1 |
| AUTH-23 | Reset with expired OTP | Wait 11 min then try | "OTP has expired" | P2 |
| AUTH-24 | Reset password too short | OTP correct, password = `123` | "Password must be at least 6 characters" | P2 |
| AUTH-25 | OTP brute force | 6 reset attempts in 60s | 429 rate-limited (5/min cap) | P2 |
| AUTH-26 | OTP input strips non-digits | Type `12a3b4c` | Only digits remain, max 6 chars | P3 |
| AUTH-27 | Logout | Click logout button | Cookie cleared, redirected to /login, can't access dashboard | P1 |
| AUTH-28 | Session timeout | Wait 7 days OR change SECRET_KEY | Token rejected, forced re-login | P3 |
| AUTH-29 | Direct URL access without login | Open `/admin` in incognito | Redirects to `/login` | P1 |
| AUTH-30 | Bearer + cookie auth both work | API call with cookie only (browser) AND with Bearer (Postman) | Both succeed | P2 |

---

## 3. User dashboard

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| DASH-01 | Dashboard loads | Login as regular user | Welcome card with name, email, mobile, city, country + 4 tiles | P1 |
| DASH-02 | Dashboard cached | Navigate to /history → back to /dashboard | Second visit instant (no spinner — TanStack Query cache) | P3 |
| DASH-03 | Profile view | Click Profile / nav.profile | Form pre-filled with all profile fields | P1 |
| DASH-04 | Profile edit | Change name → Save | "Profile updated successfully" + value persisted | P1 |
| DASH-05 | Profile letters-only | Type digits in name/birth_place/city/state | Stripped on input | P2 |
| DASH-06 | Profile mobile required | Clear mobile → Save | "Mobile number is required" | P2 |
| DASH-07 | Profile danger zone visible | Scroll to bottom of profile | Red-bordered "Delete Account" card | P1 |
| DASH-08 | Account deletion confirm | Click Delete → type "DELETE" | Delete button enables only when text matches | P1 |
| DASH-09 | Account deletion executes | Confirm with DELETE typed | Account deleted, redirected to home, can't login again | P1 |
| DASH-10 | Account deletion preserves financials | Check DB after delete | Appointments rows remain (anonymized as "(deleted user)"), documents/queries/recordings deleted | P2 |
| DASH-11 | Admin cannot self-delete | Login as admin → try delete account | Backend rejects with 400 "Admins cannot self-delete" | P2 |
| DASH-12 | Notifications page loads | Navigate to /dashboard/notifications | Lists broadcasts addressed to user; unread items have saffron border + dot | P1 |
| DASH-13 | Mark single read | Click an unread notification | Border turns sand color, dot disappears | P1 |
| DASH-14 | Mark all read | Click "Mark all as read" with unread > 0 | All notifications turn read in one click | P2 |
| DASH-15 | Notification bell badge | Have 3 unread broadcasts | Bell in navbar shows red badge "3" | P1 |
| DASH-16 | Bell auto-refresh | Admin sends a new broadcast → wait 60s | Bell badge increments without page reload | P2 |
| DASH-17 | Notification with image | Open broadcast that has image | Image renders inside the row | P2 |

---

## 4. Booking flow (CRITICAL — full revenue path)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| BOOK-01 | Booking entry | Click "Book Appointment" tile | Step 1: Terms & Conditions screen | P1 |
| BOOK-02 | Terms shows admin-set content | T&C visible | Matches what admin set in Settings → Terms | P2 |
| BOOK-03 | Cannot proceed without accepting | Don't tick → click Proceed | Button disabled | P1 |
| BOOK-04 | Proceed to form | Tick → click Proceed | Step 2: booking form | P1 |
| BOOK-05 | "Booking for" toggle defaults to Self | Form loads | Radio "Myself" selected | P1 |
| BOOK-06 | Self prefills profile | "Myself" selected | name, email, mobile, birth_place, dob, tob all populated from profile | P1 |
| BOOK-07 | Switch to Other clears form | Toggle to "Someone else" | All identity fields blank, problem & selfie cleared | P1 |
| BOOK-08 | Switch back to Self re-prefills | Toggle to Self after Other | Profile data reappears | P1 |
| BOOK-09 | Problem statement required | Submit with empty problem | Validation error | P1 |
| BOOK-10 | Selfie upload | Choose image | Filename shown next to button | P1 |
| BOOK-11 | Submit without selfie | Don't upload | Form should still submit (selfie is optional) — verify expected behavior with PM | P2 |
| BOOK-12 | Successful booking → PhonePe redirect | Submit with valid data + PhonePe configured | Redirects to PhonePe checkout | P1 |
| BOOK-13 | Successful booking — PhonePe not configured | Submit with PhonePe creds blank | Redirected to /dashboard/history with appointment in pending state | P2 |
| BOOK-14 | Booking when disabled | Admin sets booking_enabled=false → user opens /dashboard/book-appointment | "Booking on hold" page shown with admin's hold message | P1 |
| BOOK-15 | Booking limit reached | Admin sets limit=1, user has 1 active | Booking blocked with limit message | P2 |
| BOOK-16 | Booking deadline passed | Admin sets deadline in past | Booking blocked | P2 |
| BOOK-17 | Pay later — from history | Skip payment, return to /dashboard/history | Appointment shows "payment_pending" with "Complete Payment" button | P1 |
| BOOK-18 | Cancel pending appointment (user) | Click Cancel on pending | Confirm dialog → confirm → appointment removed/marked cancelled | P1 |
| BOOK-19 | Pay after admin cancel | Admin cancels appointment → user opens /history | "Cancelled" notice shown, NO Complete Payment button | P1 |
| BOOK-20 | API blocks payment for cancelled | Direct POST to `/payments/phonepe/initiate` for cancelled appt | Backend returns 400 "appointment cancelled" | P1 |
| BOOK-21 | Payment success page | Complete PhonePe payment | Lands on `/appointments/payment-status?txn=...` showing green success | P1 |
| BOOK-22 | Payment success → DB update | Check DB after success | `payment_status=paid`, `status=payment_verified`, receipt_path filled | P1 |
| BOOK-23 | Booking confirmation email | Check inbox after payment | Email with SPBSP branding, fee = current admin-set value (3500 default), receipt PDF attached | P1 |
| BOOK-24 | Booking confirmation WhatsApp | If WhatsApp configured | Same booking summary delivered to user's mobile | P2 |
| BOOK-25 | Receipt PDF correctness | Open attached PDF | Header: "SHRI PITAMBARA BAGLAMUKHI SHAKTI PITHAM / AHILYANAGAR", Booking ID: "SPBSP-{id}", fee = 3500 (or admin-set), T&C section, all user details | P1 |
| BOOK-26 | Generate invoice | History → click "Invoice" on paid booking | Opens PDF in new tab | P1 |
| BOOK-27 | Invoice PDF correctness | Same as receipt — header, IDs, fee | P1 |
| BOOK-28 | Add to Calendar | Click "Add to Calendar" on scheduled booking | Downloads .ics file with correct date/time/Zoom link | P2 |
| BOOK-29 | Join Zoom button | After admin schedules + provides Zoom link | "Join Zoom" button opens link in new tab | P1 |
| BOOK-30 | View analysis after completed | Admin marks completed with analysis upload | "View Analysis" button visible, opens file | P1 |
| BOOK-31 | Watch recording after completed | Admin provides recording link | "Watch Recording" button works | P1 |
| BOOK-32 | Sadhna docs after completed | Admin assigns sadhna docs in mark-complete flow | Docs appear in /dashboard/documents AND on the completed appointment card | P1 |
| BOOK-33 | Payment retry after failure | PhonePe returns failed → land on payment status | "Retry Payment" button works, re-initiates | P2 |

---

## 5. Sadhna documents (user side)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| DOC-01 | View list | Navigate to /dashboard/documents | All documents addressed to user appear | P1 |
| DOC-02 | Empty state | New user with no docs | "No documents yet" placeholder | P2 |
| DOC-03 | Download document | Click Download button | File opens / downloads | P1 |
| DOC-04 | Source chip — Consultation | Doc assigned during a consultation | Chip: "From Consultation #N" (primary color) | P1 |
| DOC-05 | Source chip — List | Doc assigned via user list | Chip: "From group: <list name>" (secondary color) | P1 |
| DOC-06 | Source chip — Bulk | Doc assigned via bulk select | Chip: "Group announcement" (success color) | P2 |
| DOC-07 | Source chip — Direct | Doc assigned individually (no batch) | Chip: "Sent directly by Guruji" | P2 |

---

## 6. Queries (user side)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| QRY-01 | Submit query | Fill subject + message → Send | Appears at top of "My Queries" with "open" status | P1 |
| QRY-02 | Empty state | New user | "No queries submitted yet" | P2 |
| QRY-03 | View admin reply | After admin replies | Reply appears in 🪔 Guruji's Reply section, status shows "answered" | P1 |
| QRY-04 | Recordings section | If user has recordings assigned | Shown below queries with Watch button | P2 |

---

## 7. Admin panel — Appointments

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-APT-01 | List loads | Login admin → /admin/appointments | All appointments paginated | P1 |
| ADM-APT-02 | Tab switch | Toggle Upcoming / Completed | List filters accordingly | P1 |
| ADM-APT-03 | Search by name | Type partial name | Results filter live | P1 |
| ADM-APT-04 | Filter by date | Pick date in date picker | Only that day's appointments | P2 |
| ADM-APT-05 | Sort | Switch newest/oldest/name | Order changes correctly | P2 |
| ADM-APT-06 | Pagination | 20+ appointments | Page navigation works | P2 |
| ADM-APT-07 | Mobile chip readability | Resize to 360px | Status chips stack vertically below appointment info, no overflow, label "Payment Pending" not "Payment: payment_pending" | P1 |
| ADM-APT-08 | View details | Click "View Details" | Modal opens with full appointment info | P1 |
| ADM-APT-09 | View selfie | Click selfie thumbnail | Opens in larger view | P2 |
| ADM-APT-10 | Verify payment | Click "Verify Payment" on pending | Modal asks for payment_reference → save → status changes to payment_verified | P1 |
| ADM-APT-11 | Assign slot | Click "Assign Slot" on payment_verified | Modal: pick date+time+zoom_link → save → status = scheduled | P1 |
| ADM-APT-12 | Auto-generate Zoom link | In Assign Slot modal → Generate | Zoom link populated automatically (if Zoom configured) | P2 |
| ADM-APT-13 | Reschedule | Click Reschedule on scheduled | Modal allows new date/time + reason → status = rescheduled | P1 |
| ADM-APT-14 | Mark completed | Click on scheduled → Mark Completed | Upload analysis + recording link + select sadhna docs → marked completed | P1 |
| ADM-APT-15 | Generate receipt (admin) | Click on paid → Generate Receipt | PDF generated with current settings | P1 |
| ADM-APT-16 | Generate invoice (admin) | Click on paid → Generate Invoice | PDF generated | P1 |
| ADM-APT-17 | Cancel pending appointment | Click Cancel on payment-pending | Status = cancelled (no refund) + email/WhatsApp sent to user | P1 |
| ADM-APT-18 | Cancel completed (blocked) | Try cancel on completed | Backend returns 400 | P2 |
| ADM-APT-19 | Email notifications fired | Verify each action sends email | Booking confirmed / scheduled / rescheduled / completed / cancelled all generate emails | P1 |
| ADM-APT-20 | WhatsApp notifications | If WhatsApp configured | Same notifications sent via WhatsApp to user.mobile | P2 |
| ADM-APT-21 | Slot conflict | Try to assign same date+time to two appointments | Backend rejects 2nd one | P2 |

---

## 8. Admin panel — Users

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-USR-01 | List loads | /admin/users | All registered users (role=user) | P1 |
| ADM-USR-02 | Search by name | Type | Live filter | P1 |
| ADM-USR-03 | Filter by city/state/country | Use filters | Works correctly | P2 |
| ADM-USR-04 | View user details | Click name | Modal with full profile | P1 |
| ADM-USR-05 | View consultation history | In modal | All their appointments listed | P2 |
| ADM-USR-06 | View assigned docs | In modal | All sadhna docs assigned to user | P2 |

---

## 9. Admin panel — User Lists

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-LST-01 | Create list | /admin/user-lists → Create List | Name + description + select members → saved | P1 |
| ADM-LST-02 | Rename list | Click rename | Inline edit works | P2 |
| ADM-LST-03 | Manage members | Click manage members | Searchable picker, select-all-filtered, clear works | P1 |
| ADM-LST-04 | Delete list | Click delete | Confirm → list gone | P2 |
| ADM-LST-05 | Member count badge | List shows count | Matches actual members | P2 |

---

## 10. Admin panel — Calendar

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-CAL-01 | Today highlight | /admin/calendar | Today's date highlighted | P2 |
| ADM-CAL-02 | Click a date | Click any day | Shows scheduled appointments for that day | P2 |
| ADM-CAL-03 | Zoom link from calendar | Has Zoom on a slot | Click opens link | P2 |

---

## 11. Admin panel — Sadhna Documents

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-DOC-01 | Upload to gallery | /admin/documents → Upload form | File saved to gallery, appears in list | P1 |
| ADM-DOC-02 | File type rejection | Upload .exe or .html | Backend rejects with 400 (MIME validation) | P1 |
| ADM-DOC-03 | File too large | Upload >20MB | Backend rejects with 400 | P2 |
| ADM-DOC-04 | Quick assign to lists | Click Quick Assign on a gallery doc | Pick lists → assigns to all members | P1 |
| ADM-DOC-05 | Bulk assign to selected users | Bulk Assign tab → pick gallery doc + users | Assigned, count message correct | P1 |
| ADM-DOC-06 | Bulk upload + assign | Choose Upload New + users | New doc uploaded AND assigned | P2 |
| ADM-DOC-07 | Skip duplicate assignments | Assign same doc to user who already has it | Skipped, count shown | P2 |
| ADM-DOC-08 | View assigned docs grouped by batch | Assigned tab | Bulk batches grouped under accordion | P2 |
| ADM-DOC-09 | Delete from gallery | Trash icon | Removed (existing assignments unaffected) | P2 |
| ADM-DOC-10 | Delete assigned to user | Trash on user-specific assignment | User loses access | P2 |

---

## 12. Admin panel — Recordings

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-REC-01 | Add recording | Title + URL | Saved | P1 |
| ADM-REC-02 | Bulk assign to lists | Select recording → user lists | Assigned to all members of selected lists | P1 |
| ADM-REC-03 | Delete recording | Trash | Confirm → deleted | P2 |
| ADM-REC-04 | User sees assigned recording | Login as recipient | Recording appears in /dashboard/queries Recordings section | P1 |

---

## 13. Admin panel — Queries

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-QRY-01 | View open queries | /admin/queries → Open tab | Unanswered queries | P1 |
| ADM-QRY-02 | Reply | Type reply → Send | Status flips to answered | P1 |
| ADM-QRY-03 | View answered | Answered tab | Read-only view of replies | P2 |

---

## 14. Admin panel — Broadcasts

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-BC-01 | Send to all users | Title + message + target=All | All active users get it; appears in their /dashboard/notifications | P1 |
| ADM-BC-02 | Send to specific list | Target=List → pick list | Only list members receive it | P1 |
| ADM-BC-03 | With image | Attach image | Image renders in user notification view AND in admin history | P1 |
| ADM-BC-04 | History view | After sending | Lists all past broadcasts with target chip | P2 |
| ADM-BC-05 | Delete broadcast | Trash icon | Confirm → removed for everyone (read receipts cleaned up) | P2 |
| ADM-BC-06 | Email + WhatsApp fan-out | After send | Each recipient gets email AND WhatsApp message (if configured) | P1 |
| ADM-BC-07 | Title required | Empty title | Client validation error | P2 |
| ADM-BC-08 | List required when target=List | target=List but no list selected | Validation error | P2 |
| ADM-BC-09 | Moderator can broadcast | Login as moderator | Can send broadcasts (not super-admin gated) | P2 |

---

## 15. Admin panel — Pitham Page CMS (super admin only)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| ADM-PCM-01 | Tab access blocked for moderator | Moderator opens /admin/pitham | "Only super admins can manage..." warning | P1 |
| ADM-PCM-02 | Banners — add | Banners tab → upload image | Appears on public Pitham page hero carousel | P1 |
| ADM-PCM-03 | Banners — edit caption | Edit existing | Caption updates on public page | P2 |
| ADM-PCM-04 | Banners — toggle active | Switch to inactive | Hidden from public page | P2 |
| ADM-PCM-05 | Banners — sort order | Change to lower number | Appears earlier in carousel | P3 |
| ADM-PCM-06 | Events — create | Events tab → fill form + upload image | Visible on public page | P1 |
| ADM-PCM-07 | Events — featured toggle | Star icon on event card | Becomes featured (gold border on public page) | P1 |
| ADM-PCM-08 | Events — date pickers | Pick date + time | Saves correctly, shown in user's timezone | P2 |
| ADM-PCM-09 | Events — image URL fallback | Provide URL instead of upload | Both work | P2 |
| ADM-PCM-10 | Events — delete | Trash | Confirm → gone, image file deleted | P2 |
| ADM-PCM-11 | Events — past tab | Switch to Past | Shows historic events | P2 |
| ADM-PCM-12 | Gallery — add photo | Gallery tab → upload | Appears in public Gallery section | P1 |
| ADM-PCM-13 | Testimonials — add | Name + quote + optional photo + active | Renders on public page in "Voices of Devotees" | P1 |
| ADM-PCM-14 | Testimonials — sort order | Change order | Reflects on public page | P3 |
| ADM-PCM-15 | Videos — add YouTube URL | Title + URL | Card on public page with auto-generated thumbnail | P1 |
| ADM-PCM-16 | Videos — custom thumbnail | Upload thumbnail | Used instead of YouTube auto-thumb | P2 |
| ADM-PCM-17 | Instagram — add post URL | Paste IG post URL | Embed renders on public page | P1 |
| ADM-PCM-18 | URL deep-linking | Visit /admin/pitham?tab=events | Lands on Events tab directly | P3 |
| ADM-PCM-19 | MIME validation | Upload .svg or .exe as banner | Rejected | P1 |

---

## 16. Admin panel — Settings

### 16a. General settings (admin OR moderator)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| SET-01 | Search tab — global search | Type 2+ chars | Returns matching users + appointments + documents | P1 |
| SET-02 | Reminders — send now | Click Send Reminders | Sends to users with appointments tomorrow | P2 |
| SET-03 | Consultation — change fee | Update fee → Save | New value persists, reflected in next booking + receipts | P1 |
| SET-04 | Booking on hold | Toggle off + set message | User booking page shows hold message | P1 |
| SET-05 | Booking limit | Set to 1 | Max 1 active booking enforced | P2 |
| SET-06 | Booking deadline | Set future datetime | Booking blocked after deadline | P2 |
| SET-07 | T&C editor | Edit rich text → Save | Reflected in user terms screen during booking | P1 |
| SET-08 | Contact & Social | Update fields | Reflected in /contact and footer | P1 |
| SET-09 | Map URL | Paste Google Maps embed URL | Renders in Pitham page Visit & Contact (admin only field) | P2 |

### 16b. Moderator-specific behavior

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| MOD-01 | Moderator changes fee | Update fee → Save | Goes to "pending approval", super admin must approve | P1 |
| MOD-02 | Moderator changes T&C | Edit → Save | Pending approval | P1 |
| MOD-03 | Moderator changes booking toggle | Toggle off | Direct save (no approval) | P2 |
| MOD-04 | Moderator changes contact info | Update | Direct save | P2 |
| MOD-05 | Moderator cannot change Map URL | Try to update | Field absent OR rejected | P2 |
| MOD-06 | Moderator cannot see Audit tab | Login as moderator | Audit tab hidden | P1 |
| MOD-07 | Moderator cannot see Export tab | Login as moderator | Export tab hidden | P1 |
| MOD-08 | Moderator cannot see Moderators tab | Login as moderator | Moderators tab hidden | P1 |
| MOD-09 | Moderator cannot edit Pitham CMS | Try /admin/pitham | Forbidden warning | P1 |
| MOD-10 | Moderator endpoint enforcement | Direct API call to `/admin/pitham/banners` as moderator | Backend returns 403 | P1 |

### 16c. Super-admin only

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| SADM-01 | Audit log loads | /admin/settings → Audit tab | All admin actions listed | P1 |
| SADM-02 | Audit filter — admin | Filter by admin name | Only that admin's actions | P2 |
| SADM-03 | Audit filter — action | Filter by action type | Filtered correctly | P2 |
| SADM-04 | Audit date range | Pick from/to dates | Filtered | P2 |
| SADM-05 | Export — Users CSV | Click Export Users | CSV download with all users | P1 |
| SADM-06 | Export — Appointments CSV | With date range | CSV download | P1 |
| SADM-07 | Export — Payments CSV | With date range | Booking IDs prefixed "SPBSP-" | P1 |
| SADM-08 | Invoice ZIP download | Pick date range → download ZIP | All paid invoices for range bundled | P1 |
| SADM-09 | Pending approvals card | When moderator submitted fee/T&C change | Card appears with Approve / Reject buttons | P1 |
| SADM-10 | Approve pending | Click Approve | Setting applied, audit logged | P1 |
| SADM-11 | Reject pending | Click Reject | Setting unchanged, removed from queue | P1 |

### 16d. Moderator management (super admin only)

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| MGT-01 | Moderators tab loads | Settings → Moderators | List of current moderators + count chip "N of 5 used" | P1 |
| MGT-02 | Promote user | Search user → Make Moderator → Confirm | User now has moderator role, count increments | P1 |
| MGT-03 | At-limit warning | After 5 moderators promoted | Warning alert + Add controls disabled | P1 |
| MGT-04 | Promote beyond limit blocked | Direct API call to promote a 6th | Backend returns 400 "Moderator limit reached" | P1 |
| MGT-05 | Revoke moderator | Click Revoke → Confirm | User downgraded to regular user, count decrements | P1 |
| MGT-06 | Cannot demote admin | Try to change another admin's role | Backend returns 400 | P1 |
| MGT-07 | Cannot self-change-role | Login as admin → try to change own role via API | Backend returns 400 | P1 |

---

## 17. i18n / Localization

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| I18N-01 | Switch English | Default | All UI in English | P1 |
| I18N-02 | Switch Hindi | Lang menu → Hindi | All UI in Hindi (हिन्दी) | P1 |
| I18N-03 | Switch Marathi | Lang menu → Marathi | All UI in Marathi (मराठी) | P1 |
| I18N-04 | Persistence across pages | Switch lang → navigate | Stays in chosen language | P1 |
| I18N-05 | Persistence after reload | Switch → reload | Stays in chosen language (localStorage) | P2 |
| I18N-06 | Mobile drawer language | Open hamburger (mobile) | Pill buttons for all 3 languages, current highlighted | P2 |
| I18N-07 | Date formatting | Hindi/Marathi | Dates render in respective locale where used (event dates) | P3 |
| I18N-08 | Email subject language | Switch to Hindi → trigger an email-sending action | Emails are in English (intentional — admin/business comms) | P3 |

---

## 18. Mobile responsive

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| RESP-01 | Public landing | View on 360px | No horizontal scroll | P1 |
| RESP-02 | Pitham page | 360px | Hero/sections stack, banner carousel works | P1 |
| RESP-03 | Login + Register | 360px | Forms readable, buttons full-width | P1 |
| RESP-04 | Dashboard tiles | 360px | Tiles stack 2x2 or 1col | P1 |
| RESP-05 | Booking form | 360px | All fields readable, date/time pickers work | P1 |
| RESP-06 | Admin nav drawer | 360px | Hamburger opens drawer, all nav links accessible | P1 |
| RESP-07 | Admin appointments | 360px | Cards readable, chips don't overlap | P1 |
| RESP-08 | Admin filters | 360px | Filter inputs wrap to multiple rows, no overflow | P2 |
| RESP-09 | Admin Pitham CMS tabs | 360px | Tabs scrollable horizontally | P2 |
| RESP-10 | Modals/Dialogs | 360px | Use full viewport width with proper padding | P2 |
| RESP-11 | Tables | 360px | Horizontal scroll within table container, page itself doesn't scroll | P2 |

---

## 19. Security / Negative testing

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| SEC-01 | Direct admin URL as user | Login as user → visit /admin | Redirects to /login OR returns blank | P1 |
| SEC-02 | Direct admin API as user | Bearer = user token, hit `/admin/users` | 403 Admin access required | P1 |
| SEC-03 | Direct super-admin API as moderator | Bearer = moderator token, hit `/admin/pitham/media` | 403 Super admin access required | P1 |
| SEC-04 | XSS in profile | Save name = `<script>alert(1)</script>` | Stripped by sanitize OR rendered as text, never executed | P1 |
| SEC-05 | XSS in problem statement | Same | Sanitized | P1 |
| SEC-06 | XSS in T&C editor | Insert script tag | Bleach strips on backend save | P1 |
| SEC-07 | SQL injection in search | Search = `'; DROP TABLE users;--` | SQLAlchemy parameterizes; no harm | P1 |
| SEC-08 | File upload with .exe extension | Try to upload | Backend rejects | P1 |
| SEC-09 | File upload with valid extension but wrong MIME | image.jpg actually being script | Backend rejects | P2 |
| SEC-10 | Oversized file upload | 30MB image | Backend rejects with 400 | P1 |
| SEC-11 | CSRF — auth cookie SameSite | From a different domain, attempt POST | Cookie not sent (SameSite blocks) | P2 |
| SEC-12 | Rate limit — admin endpoints | 121+ requests in 60s to `/admin/users` | 429 Too Many Requests | P2 |
| SEC-13 | Token expiry | Use 7+ day old token | 401 Invalid or expired | P2 |
| SEC-14 | Cookie httpOnly | DevTools → Application → Cookies | Auth cookie marked HttpOnly | P1 |
| SEC-15 | Logout clears server cookie | Click logout | Set-Cookie response clears `pitham_session` | P1 |
| SEC-16 | Reset OTP not user-enumerable | Submit forgot-password for unknown email | Same generic success message | P2 |
| SEC-17 | OTP brute-force | Try 6 wrong OTPs rapidly | Rate limited at 5/min | P2 |

---

## 20. Notifications cross-check

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| NTF-01 | Email config detection | Check Render startup logs | Log shows `Integrations configured: {'email': True/False, ...}` | P2 |
| NTF-02 | WhatsApp config detection | Same | Log shows `'whatsapp': True/False` | P2 |
| NTF-03 | Notifications no-op when not configured | Disable email creds → trigger booking | Booking succeeds, "EMAIL (stub)" in logs | P2 |
| NTF-04 | Email asynchronous | Trigger 5 bookings rapidly | All API responses return quickly (emails go to background pool) | P3 |
| NTF-05 | Receipt PDF attached | Booking confirmation email | Has PDF attachment | P1 |

---

## 21. Performance / UX

| # | Scenario | Steps | Expected | Priority |
|---|---|---|---|---|
| PERF-01 | Cached navigation | Login → dashboard → history → back to dashboard | 2nd dashboard visit instant (no spinner) | P3 |
| PERF-02 | Image lazy loading | Open Pitham page Network tab, scroll | Below-fold images load on scroll, not on initial paint | P3 |
| PERF-03 | Bundle size sanity | Run `npm run analyze` | No single chunk > 500KB; MUI tree-shaken | P3 |
| PERF-04 | First Contentful Paint | Lighthouse on /pitham | <2s on Fast 3G simulation | P3 |

---

## 22. Known issues / Out of scope (don't file bugs for these)

- **Render free tier cold start** — backend takes 30–50s to wake up after 15min idle. Refresh and wait.
- **PhonePe sandbox console errors** — `events/batch` CORS error and `instrument/validate` 500 are PhonePe's own analytics/validation services. Harmless if payment succeeds.
- **Uploaded files vanish on backend redeploy** — local disk is ephemeral on Render free tier. Use S3 storage for prod (set `STORAGE_DRIVER=s3` + S3 env vars).
- **Sitemap shows wrong domain** — until `NEXT_PUBLIC_SITE_URL` is set to the actual frontend URL.
- **WhatsApp templates in production** — outside the 24h customer-service window, only approved templates work. Set `WHATSAPP_DEFAULT_TEMPLATE` env var with a Meta-approved template name.

---

## 23. Bug report template (copy-paste for issues)

```
**Bug ID**: 
**Test case ID**: (from this doc, e.g. ADM-APT-17)
**Environment**: dev / staging / prod
**Browser + version**: 
**Device**: desktop / iPad / iPhone (specify size if mobile)
**User role**: regular / moderator / super-admin
**Steps to reproduce**:
  1. 
  2. 
  3. 
**Expected**: (from test case)
**Actual**: 
**Screenshot / video**: (attach)
**Console errors**: (paste from DevTools)
**Network errors**: (paste failed requests)
**Priority**: P1 / P2 / P3
**Notes**: 
```

---

**End of test plan.** ~250 test cases across 22 modules. Suggest splitting across testers by module for parallel execution. Re-run all P1 cases after every bug fix; full regression before each prod deploy.
