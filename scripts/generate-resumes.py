"""Create the English and Spanish, single-column, selectable-text resumes.
Requires reportlab and fonttools. Source facts match the portfolio and LinkedIn.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as PDFFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / '.generated/fonts'
FONT_DIR.mkdir(parents=True, exist_ok=True)
for label, weight in [('Body', 400), ('Bold', 700)]:
    font = TTFont(ROOT / 'src/assets/fonts/Satoshi-Variable.ttf')
    font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
    # ReportLab caches faces by the font's internal PostScript name.
    # Give the two static instances distinct names so bold stays bold.
    for record in font['name'].names:
        names = {1: 'Satoshi CV', 2: 'Bold' if label == 'Bold' else 'Regular', 4: f'Satoshi CV {label}', 6: f'SatoshiCV-{label}'}
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    path = FONT_DIR / f'{label}.ttf'
    font.save(path)
    pdfmetrics.registerFont(PDFFont(label, str(path)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Body', boldItalic='Bold')

CONTENT = {
 'EN': {
  'subtitle': 'Full Stack Developer / Creative Technology',
  'summary': 'Full stack developer and Multimedia Design graduate combining software, interaction design and applied AI. I build mobile applications and business tools for international clients at GoPersonal and teach programming and interactive design at ORT. Independent projects explore games, real-time interaction and AI-assisted development.',
  'experience': 'EXPERIENCE', 'projects': 'SELECTED PROJECTS', 'education': 'EDUCATION & CREDENTIALS', 'skills': 'CAPABILITIES & TOOLS', 'languages': 'LANGUAGES',
  'jobs': [
   ('Full Stack Developer', 'GoPersonal', 'Apr 2025 - Present', 'Develop and implement software for international clients: mobile applications, business management tools and AI service integrations. Work across technology stacks to help digitize processes and improve operations.'),
   ('Lecturer & Teaching Assistant', 'Universidad ORT Uruguay', 'Apr 2025 - Present', 'Interactive Design lecturer (Mar 2026 - Present); Programming 2 lecturer (Aug 2025 - Present); Programming 1 teaching assistant (Apr - Jul 2025). Teach advanced JavaScript, APIs and introductory backend development. Guide interactive projects connecting design, technology and AI.'),
   ('Full Stack Developer', 'NS Group', 'Mar 2024 - Aug 2025', 'Full stack web development, combining frontend interfaces with backend application logic.'),
   ('Web Developer', 'Dango', 'Jul 2024 - Apr 2025', 'Web and e-commerce development with WordPress, Shopify, PHP and Tailwind CSS, with attention to visual detail and functionality.'),
  ],
  'project_items': [
   ('El Impostor', 'https://impostor.gratis/', 'Browser-based social deduction game. Connects game logic, interaction design and AI exploration with Next.js, TypeScript and Tailwind CSS.'),
   ('Phone-to-TV keyboard', 'https://www.linkedin.com/feed/update/urn:li:activity:7521309877177241601/', 'An app built with Claude Code to type on Android TV from a phone, solving an everyday usability problem.'),
   ('Interactive YouTube game', 'https://www.linkedin.com/feed/update/urn:li:activity:7477082823158403072/', 'Turned a YouTube video into a playable experience and documented the experiment publicly.'),
   ('Wordle Infinito', 'https://www.pablocarvalho.dev/#work', 'Full stack web game with Next.js, TypeScript, Node.js, MongoDB and WebSocket. Also explored opening-word strategies through programming and data analysis.'),
  ],
  'degree': '<b>Multimedia Design degree</b> | Universidad ORT Uruguay | 2020 - 2025',
  'credentials': 'Web Designer, intermediate qualification - ORT (issued 2023). React JS - Coderhouse (2023).',
  'tools': '<b>Capabilities:</b> full stack development, digital products, AI integration, interaction design, mobile applications, technical teaching.<br/><b>Tools:</b> React, Next.js, TypeScript, Node.js, Express, MongoDB, SQL, Tailwind CSS, Figma, Git.',
  'language_values': 'Spanish: native. English: B2.',
 },
 'ES': {
  'subtitle': 'Desarrollador Full Stack / Tecnología Creativa',
  'summary': 'Desarrollador full stack y licenciado en Diseño Multimedia. Combino software, diseño de interacción e IA aplicada. En GoPersonal construyo aplicaciones móviles y herramientas para clientes internacionales; en ORT enseño programación y diseño interactivo. Mis proyectos propios exploran juegos, interacción en tiempo real y desarrollo asistido por IA.',
  'experience': 'EXPERIENCIA', 'projects': 'PROYECTOS SELECCIONADOS', 'education': 'FORMACIÓN Y CREDENCIALES', 'skills': 'CAPACIDADES Y HERRAMIENTAS', 'languages': 'IDIOMAS',
  'jobs': [
   ('Desarrollador Full Stack', 'GoPersonal', 'abr. 2025 - Actualidad', 'Desarrollo e implementación de software para clientes internacionales: aplicaciones móviles, herramientas de gestión e integración de servicios de IA. Trabajo con distintos stacks para digitalizar procesos y mejorar la operación.'),
   ('Docente y asistente docente', 'Universidad ORT Uruguay', 'abr. 2025 - Actualidad', 'Profesor de Diseño Interactivo (mar. 2026 - Actualidad) y Programación 2 (ago. 2025 - Actualidad). Asistente de Programación 1 (abr. - jul. 2025). Enseñanza de JavaScript avanzado, APIs e introducción al backend. Acompañamiento de proyectos que conectan diseño, tecnología e IA.'),
   ('Desarrollador Full Stack', 'NS Group', 'mar. 2024 - ago. 2025', 'Desarrollo web full stack, combinando interfaces frontend con lógica de aplicación en el backend.'),
   ('Desarrollador Web', 'Dango', 'jul. 2024 - abr. 2025', 'Desarrollo web y e-commerce con WordPress, Shopify, PHP y Tailwind CSS, con atención al detalle visual y la funcionalidad.'),
  ],
  'project_items': [
   ('El Impostor', 'https://impostor.gratis/', 'Juego de deducción social desde el navegador. Une lógica de juego, interacción y exploración con IA usando Next.js, TypeScript y Tailwind CSS.'),
   ('Teclado móvil para Android TV', 'https://www.linkedin.com/feed/update/urn:li:activity:7521309877177241601/', 'App creada con Claude Code para escribir en la tele desde el celular y resolver una fricción cotidiana de uso.'),
   ('Juego interactivo en YouTube', 'https://www.linkedin.com/feed/update/urn:li:activity:7477082823158403072/', 'Conversión de un video de YouTube en una experiencia jugable, con demostración y documentación pública del experimento.'),
   ('Wordle Infinito', 'https://www.pablocarvalho.dev/es/#work', 'Juego web full stack con Next.js, TypeScript, Node.js, MongoDB y WebSocket. Exploración de estrategias de palabras iniciales mediante código y análisis de datos.'),
  ],
  'degree': '<b>Licenciatura en Diseño Multimedia</b> | Universidad ORT Uruguay | 2020 - 2025',
  'credentials': 'Diseñador Web, título intermedio - ORT (expedido en 2023). React JS - Coderhouse (2023).',
  'tools': '<b>Capacidades:</b> desarrollo full stack, productos digitales, integración de IA, diseño de interacción, aplicaciones móviles y docencia técnica.<br/><b>Herramientas:</b> React, Next.js, TypeScript, Node.js, Express, MongoDB, SQL, Tailwind CSS, Figma, Git.',
  'language_values': 'Español: nativo. Inglés: B2.',
 },
}

WIDTH, HEIGHT = A4
LEFT, RIGHT = 42, 42
TEXT_WIDTH = WIDTH - LEFT - RIGHT
INK = colors.HexColor('#262824')
MUTED = colors.HexColor('#64685c')
ACCENT = colors.HexColor('#996443')

def create(language, data):
    path = ROOT / 'public/cv' / f'Pablo_Carvalho_{language}.pdf'
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    pdf.setTitle(f'Pablo Carvalho - CV {language}')
    pdf.setAuthor('Pablo Carvalho')
    pdf.setSubject(data['subtitle'])
    pdf.setFillColor(INK)
    pdf.setFont('Bold', 27)
    pdf.drawString(LEFT, HEIGHT - 58, 'PABLO CARVALHO')
    pdf.setFont('Body', 11)
    pdf.drawString(LEFT, HEIGHT - 78, data['subtitle'])
    pdf.setFillColor(ACCENT)
    pdf.rect(LEFT, HEIGHT - 92, 45, 2, fill=1, stroke=0)
    y = HEIGHT - 112
    body = ParagraphStyle('body', fontName='Body', fontSize=10, leading=13.4, textColor=INK)
    small = ParagraphStyle('small', parent=body, fontSize=8.5, leading=11.7, textColor=MUTED)
    header = ParagraphStyle('header', parent=body, fontSize=10.2, leading=13.7)

    def paragraph(text, style=body, gap=5):
        nonlocal y
        item = Paragraph(text, style)
        _, height = item.wrap(TEXT_WIDTH, HEIGHT)
        item.drawOn(pdf, LEFT, y - height)
        y -= height + gap

    def section(title):
        nonlocal y
        y -= 10
        pdf.setFillColor(ACCENT)
        pdf.setFont('Bold', 8.5)
        pdf.drawString(LEFT, y, title)
        pdf.setStrokeColor(colors.HexColor('#d9dbd2'))
        pdf.line(LEFT, y - 6, WIDTH - RIGHT, y - 6)
        y -= 19

    paragraph('Montevideo, Uruguay · +598 94 375 127 · <link href="mailto:pablocarvalhogimenez@gmail.com">pablocarvalhogimenez@gmail.com</link>', small, 3)
    paragraph('<link href="https://www.pablocarvalho.dev">pablocarvalho.dev</link> · <link href="https://github.com/PolCarva">github.com/PolCarva</link> · <link href="https://www.linkedin.com/in/pablo-carvalho-gimenez/">linkedin.com/in/pablo-carvalho-gimenez</link>', small, 10)
    paragraph(escape(data['summary']), body, 3)
    section(data['experience'])
    for role, company, date, text in data['jobs']:
        paragraph(f'<b>{escape(role)} | {escape(company)}</b> <font color="#64685c">· {escape(date)}</font>', header, 3)
        paragraph(escape(text), body, 8)
    section(data['projects'])
    for name, href, text in data['project_items']:
        paragraph(f'<b><link href="{href}">{escape(name)}</link></b> - {escape(text)}', body, 5)
    section(data['education'])
    paragraph(data['degree'], body, 3)
    paragraph(escape(data['credentials']), small, 2)
    section(data['skills'])
    paragraph(data['tools'], body, 2)
    section(data['languages'])
    paragraph(escape(data['language_values']), body, 0)
    if y < 35:
        raise ValueError(f'{language} resume overflows: final y={y:.1f}')
    pdf.showPage()
    pdf.save()
    print(f'{language}: one page, final content baseline {y:.1f}pt; {path.stat().st_size:,} bytes')

for language, content in CONTENT.items():
    create(language, content)
