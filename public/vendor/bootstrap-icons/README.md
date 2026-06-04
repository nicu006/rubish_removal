# Bootstrap Icons (gratuit, MIT)

Bibliotecă de **iconițe ca font** — folosești clase CSS, fără SVG manual.

- Site oficial: https://icons.getbootstrap.com/
- Peste 2000 iconițe gratuite
- Fișiere locale: `bootstrap-icons.min.css` + `fonts/`

## Exemplu

```html
<i class="bi bi-truck" aria-hidden="true"></i>
<i class="bi bi-shield-check"></i>
```

Culoarea vine din CSS (`color: #2ecc71`).

## Adăugare iconițe noi

Caută numele pe https://icons.getbootstrap.com/ și folosește clasa `bi bi-nume-icon`.

Pentru actualizare bibliotecă:

```powershell
cd backend
npm update bootstrap-icons
Copy-Item node_modules\bootstrap-icons\font\bootstrap-icons.min.css ..\public\vendor\bootstrap-icons\
Copy-Item node_modules\bootstrap-icons\font\fonts\* ..\public\vendor\bootstrap-icons\fonts\
```
