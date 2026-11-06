'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Heading3,
  Layers,
  Link2,
  List,
  ListOrdered,
  PenTool,
  Pin,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { AdminLocale } from '@/modules/audit/i18n/adminDict'
import './document-studio.css'

export interface StudioDocItem {
  id: string
  type: 'contract' | 'scripts'
  name: string
  lang: 'ar' | 'en'
  folder: string | null
  pinned: boolean
  updated: number
}

export interface StudioBridgeApi {
  newDoc: (type: 'contract' | 'scripts') => void
  setLang: (lang: 'ar' | 'en') => void
  home: () => void
  setFilter: (filter: 'all' | 'contract' | 'scripts' | 'pinned') => void
  open: (id: string) => void
  del: (id: string) => void
  openSig: () => void
  openCmd: () => void
  importTrigger: () => void
  backupAll: () => void
  exportPdf: () => void
  share: () => void
  list: () => StudioDocItem[]
}

export interface ScriptItemData {
  title: string
  format: string
  platform: string
  ref: string
  hook: string
  script: string
  cta: string
  noRef?: boolean
}

export interface StudioFullDoc {
  id: string
  type: 'contract' | 'scripts'
  lang: 'ar' | 'en'
  name: string
  customName?: string
  folder: string | null
  pinned: boolean
  created: number
  updated: number
  sig?: string
  cover: Record<string, string>
  body?: string
  scripts?: ScriptItemData[]
}

export interface StudioFolder {
  id: string
  name: string
  open?: boolean
}

interface AdminDocumentStudioViewProps {
  adminLang: AdminLocale
  mode: 'contract' | 'scripts'
  onDocsSync?: (docs: StudioDocItem[], currentId: string | null) => void
  onRegisterApi?: (api: StudioBridgeApi | null) => void
  standalonePublicMode?: boolean
}

const APX_MARK_PATH =
  'M246.5 248.6C233.5 246.0 221.6 241.0 212.5 234.0C205.9 229.0 187.0 210.8 187.0 209.5C187.0 208.9 194.0 201.3 202.6 192.6L218.1 176.8L228.3 186.7C240.2 198.2 243.4 200.4 252.1 202.6C260.7 204.8 269.5 203.9 277.7 199.9C282.8 197.5 288.0 192.9 305.7 175.5C317.7 163.7 328.3 152.8 329.4 151.4L331.2 148.8L319.4 136.7C294.5 111.1 250.0 66.2 243.3 60.0C233.9 51.0 229.3 49.0 218.5 49.0C207.7 49.0 201.0 51.4 195.3 57.2C189.9 62.8 177.9 79.0 133.5 140.5C87.2 204.7 59.5 242.3 57.7 243.8C56.6 244.7 48.7 245.0 28.0 244.8L-0.2 244.5L9.1 231.5C26.0 207.9 150.2 38.6 155.7 31.8C170.5 13.1 185.8 3.9 206.6 0.9C226.8 -2.0 247.8 3.4 263.6 15.3C267.0 17.9 286.9 37.9 307.8 59.7C328.7 81.6 349.8 103.5 354.7 108.3L363.6 117.1L419.9 60.0L476.2 3.0L507.3 3.0L538.3 3.0L531.4 10.2C527.6 14.2 499.1 43.4 468.0 75.0C404.0 140.0 396.6 147.7 396.2 149.5C396.0 150.2 409.3 164.5 425.7 181.2C478.7 235.3 482.8 239.5 484.9 242.1L487.0 244.8L456.7 245.5L426.5 246.2L394.8 213.9L363.2 181.5L335.8 208.6C305.7 238.5 302.7 240.7 285.7 246.2C274.5 249.8 257.9 250.8 246.5 248.6Z'

function ApxVectorMark({ className }: { className?: string }) {
  return (
    <span className={`mk ${className || ''}`}>
      <svg viewBox="0 0 538 250" aria-hidden="true">
        <path d={APX_MARK_PATH} />
      </svg>
    </span>
  )
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function todayFormatted(l: 'ar' | 'en'): string {
  return new Date().toLocaleDateString(l === 'en' ? 'en-GB' : 'ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function monthNowFormatted(l: 'ar' | 'en'): string {
  return new Date().toLocaleDateString(l === 'en' ? 'en-GB' : 'ar-EG', {
    month: 'long',
    year: 'numeric',
  })
}

function defaultContractBody(l: 'ar' | 'en'): string {
  const co = 'APX'
  const d = todayFormatted(l)
  if (l === 'en') {
    return (
      '<h2>Master Services Agreement</h2>' +
      `<p>This Master Services Agreement (the <b>“Agreement”</b>) is entered into and made effective as of <b>${d}</b> (the <b>“Effective Date”</b>), by and between:</p>` +
      `<div class="parties"><div class="party"><label>FIRST PARTY · SERVICE PROVIDER</label><p><b>${co}</b></p><p>Represented by: [Authorized Representative &amp; Title]</p><p>Commercial Reg. / Tax ID: [Registration Number]</p><p>Address &amp; Email: [Address / Official Email]</p></div>` +
      '<div class="party"><label>SECOND PARTY · CLIENT</label><p><b>[Client Legal / Brand Name]</b></p><p>Represented by: [Representative Name &amp; Title]</p><p>Commercial Reg. / National ID: [ID / CR Number]</p><p>Address &amp; Email: [Address / Official Email]</p></div></div>' +
      '<div class="preamble"><label>RECITALS · PREAMBLE</label>' +
      '<p><b>WHEREAS</b>, the First Party is a specialized agency operating in digital production, creative strategy, and marketing solutions; and <b>WHEREAS</b>, the Second Party desires to engage the First Party to perform the services described herein;</p>' +
      '<p><b>NOW, THEREFORE</b>, in consideration of the mutual covenants and promises set forth herein, the Parties having full legal capacity agree as follows:</p></div>' +
      '<h3>Definitions &amp; Interpretation</h3><ol><li>The foregoing Recitals and any signed annexes or approved scope schedules form an integral and binding part of this Agreement.</li><li><b>“Deliverables”</b> means all creative assets, scripts, videos, designs, or campaigns produced under this Agreement. <b>“Business Days”</b> means official working days excluding public holidays.</li></ol>' +
      '<h3>Scope of Services</h3><ol><li>The First Party shall provide the Second Party with the following services: [Detailed description of monthly deliverables / services].</li><li>All services shall be executed in accordance with professional industry standards and the approved creative direction.</li><li>Any additional work outside the scope stated in Clause 2.1 (<b>“Change Request”</b>) shall require prior written approval and a separate fee quotation.</li></ol>' +
      '<h3>Deliverables, Revisions &amp; Acceptance</h3><ol><li>The Second Party is entitled to up to [2] rounds of consolidated revisions per deliverable within [3] Business Days of submission.</li><li>If the Second Party does not provide written feedback within [5] Business Days from delivery, the Deliverable shall be deemed accepted and approved.</li><li>Revisions requested after final approval or departing from the approved brief shall be billed separately.</li></ol>' +
      '<h3>Fees, Invoicing &amp; Payment Terms</h3><ol><li>In consideration for the Services, the Second Party shall pay the First Party a total fee of <b>[Amount] [Currency]</b> (excluding applicable VAT or withholding taxes).</li><li>Payment shall be settled according to the following schedule: [50% advance payment upon signing / 50% upon delivery or monthly cycle].</li><li>In the event of payment delay exceeding [5] Business Days, the First Party reserves the right to suspend work and delivery until all outstanding dues are settled.</li></ol>' +
      '<h3>Term &amp; Execution Timeline</h3><ol><li>This Agreement shall remain in force for a period of <b>[Duration]</b> commencing on [Start Date], provided that the advance payment and required brand assets are received.</li><li>Any delay by the Second Party in supplying materials, access, or approvals shall automatically extend the delivery timeline by an equivalent period.</li></ol>' +
      '<h3>Obligations of the Parties</h3><ol><li><b>First Party Obligations:</b> Perform the Services with professional care, adhere to agreed schedules, and assign qualified personnel.</li><li><b>Second Party Obligations:</b> Appoint a single authorized point of contact, provide accurate information and brand assets, and settle payments on time.</li></ol>' +
      '<h3>Intellectual Property &amp; Portfolio Rights</h3><ol><li>Full usage and exploitation rights to the final approved Deliverables shall transfer to the Second Party strictly upon full settlement of all financial obligations under this Agreement.</li><li>All pre-existing tools, methodologies, raw source files, and unaccepted drafts remain the exclusive property of the First Party unless otherwise agreed in writing.</li><li>The First Party retains the right to display the completed Deliverables in its portfolio and case studies after public release.</li></ol>' +
      '<h3>Confidentiality &amp; Data Protection</h3><ol><li>Each Party undertakes to keep strictly confidential all non-public business, financial, technical, and marketing information disclosed by the other Party during the term of this Agreement and for [2] years thereafter.</li></ol>' +
      '<h3>Warranties &amp; Limitation of Liability</h3><ol><li>The Second Party warrants that all materials, trademarks, and data provided to the First Party do not infringe any third-party rights or applicable laws.</li><li>Neither Party shall be liable for indirect or consequential damages (including platform algorithm changes or third-party ad performance). Total aggregate liability shall not exceed the fees paid for the relevant billing cycle.</li></ol>' +
      '<h3>Termination &amp; Force Majeure</h3><ol><li>Either Party may terminate this Agreement by giving at least [15] days prior written notice, or immediately if a material breach remains uncured for [7] Business Days after written notice.</li><li>Upon termination, the Second Party shall pay for all work completed or in progress up to the effective termination date; advance payments for commenced cycles are non-refundable.</li><li>Neither Party shall be liable for delays caused by Force Majeure events beyond reasonable control.</li></ol>' +
      '<h3>Governing Law, Notices &amp; Dispute Resolution</h3><ol><li>Any dispute arising out of this Agreement shall first be resolved amicably within [15] days; failing which, the competent courts of <b>[City / Country]</b> shall have exclusive jurisdiction.</li><li>This Agreement constitutes the entire understanding between the Parties and supersedes all prior discussions.</li></ol>' +
      '<div class="closing"><p><b>IN WITNESS WHEREOF</b>, the Parties have executed this Agreement in two original counterparts, each Party receiving one copy to act in accordance therewith, and affixed their signatures on each page hereof.</p></div>'
    )
  }

  return (
    '<h2>عقد تقديم خدمات احترافية</h2>' +
    `<p>إنه في يوم <b>${d}</b>، حُررت هذه الاتفاقية ودخلت حيز النفاذ بين كلٍّ من:</p>` +
    `<div class="parties"><div class="party"><label>FIRST PARTY · <span>الطرف الأول (مقدّم الخدمة)</span></label><p><b>${co}</b></p><p>يمثلها قانونًا: [الاسم والمسمى الوظيفي]</p><p>سجل تجاري / بطاقة ضريبية: [الرقم]</p><p>العنوان والبريد المعتمد: [العنوان / الإيميل]</p></div>` +
    '<div class="party"><label>SECOND PARTY · <span>الطرف الثاني (العميل)</span></label><p><b>[اسم الشركة / العميل]</b></p><p>يمثلها قانونًا: [الاسم والمسمى الوظيفي]</p><p>سجل تجاري / رقم قومي: [الرقم]</p><p>العنوان والبريد المعتمد: [العنوان / الإيميل]</p></div></div>' +
    '<div class="preamble"><label>RECITALS · <span>التمهيد</span></label>' +
    '<p><b>حيث إن</b> الطرف الأول شركة متخصصة في مجالات الإنتاج الإبداعي، صناعة المحتوى، والحلول التسويقية الرقمية؛ <b>وحيث إن</b> الطرف الثاني يرغب في الاستعانة بخبرات الطرف الأول لتنفيذ الأعمال المبيّنة في هذا العقد؛</p>' +
    '<p><b>لذا فقد تلاقت إرادة الطرفين</b> وهما بكامل الأهلية المعتبرة قانونًا على إبرام هذا العقد وفقًا للبنود والشروط الآتية:</p></div>' +
    '<h3>حجية التمهيد والتعريفات</h3><ol><li>يُعد التمهيد السابق وكافة الملاحق أو عروض الأسعار المعتمدة جزءًا لا يتجزأ من هذا العقد ومكمّلًا ومفسّرًا لبنوده.</li><li>يقصد بـ <b>«المخرجات»</b> كافة الأعمال الإبداعية أو السكربتات أو الفيديوهات المتفق عليها، ويقصد بـ <b>«أيام العمل»</b> أيام العمل الرسمية باستثناء العطلات الرسمية.</li></ol>' +
    '<h3>نطاق العمل والخدمات</h3><ol><li>يلتزم الطرف الأول بتقديم الخدمات والمخرجات التالية لصالح الطرف الثاني: [تفصيل الخدمات وعدد المخرجات الشهرية أو نطاق المشروع].</li><li>ينفّذ الطرف الأول الأعمال وفق أعلى المعايير المهنية والفنية المتعارف عليها وبما يتوافق مع الهوية المعتمدة للطرف الثاني.</li><li>أي أعمال إضافية خارج النطاق المحدد في البند (2.1) تُعد <b>«طلب تغيير»</b> وتخضع لاتفاق مستقل بتكلفة ومدة زمنية إضافية.</li></ol>' +
    '<h3>التسليم والمراجعات والاعتماد</h3><ol><li>يحق للطرف الثاني طلب حتى [٢] جولة من التعديلات المجمّعة على كل مخرج خلال [٣] أيام عمل من تاريخ إرساله للمراجعة.</li><li>في حال عدم إرسال الطرف الثاني لملاحظاته خلال [٥] أيام عمل من تاريخ التسليم، يُعتبر المخرج معتمدًا ومقبولًا نهائيًا.</li><li>أي تعديلات جوهرية تُطلب بعد الاعتماد النهائي أو تخالف التوجيه المتفق عليه مسبقًا تُحتسب بتكلفة مستقلة.</li></ol>' +
    '<h3>المقابل المالي وشروط السداد</h3><ol><li>يلتزم الطرف الثاني بسداد إجمالي مبلغ وقدره <b>[المبلغ] [العملة]</b> نظير الخدمات المتفق عليها (غير شامل ضريبة القيمة المضافة إن وجدت).</li><li>يتم السداد وفق الجدول التالي: [٥٠٪ دفعة مقدمة عند التوقيع و٥٠٪ عند التسليم / أو شهريًا مقدمًا في أول كل شهر].</li><li>في حال تأخر السداد عن الموعد المحدد لأكثر من [٥] أيام عمل، يحق للطرف الأول تعليق العمل والتسليمات مؤقتًا لحين سداد المستحقات دون أدنى مسؤولية.</li></ol>' +
    '<h3>مدة العقد والجدول الزمني</h3><ol><li>يسري هذا العقد لمدة <b>[المدة]</b> تبدأ من تاريخ [تاريخ البداية] شريطة استلام الدفعة المقدمة والمواد اللازمة لبدء التنفيذ.</li><li>يمتد الجدول الزمني للتسليم تلقائيًا بقدر أي تأخير ينشأ عن تأخر الطرف الثاني في تسليم المواد أو الاعتمادات المطلوبة.</li></ol>' +
    '<h3>التزامات الطرفين</h3><ol><li><b>التزامات الطرف الأول:</b> بذل العناية المهنية اللازمة، الالتزام بالمواعيد المتفق عليها، وتخصيص فريق عمل مؤهل لتنفيذ المشروع.</li><li><b>التزامات الطرف الثاني:</b> تعيين ممثل واحد معتمد للتواصل والاعتماد، وتزويد الطرف الأول بالمعلومات والملفات اللازمة في مواعيدها.</li></ol>' +
    '<h3>حقوق الملكية الفكرية وعرض الأعمال</h3><ol><li>تنتقل حقوق الاستخدام والنشر للمخرجات النهائية المعتمدة إلى الطرف الثاني فور سداد كامل المستحقات المالية المقررة بموجب هذا العقد.</li><li>تظل كافة الأدوات، القوالب، والملفات المفتوحة أو المسودات غير المعتمدة ملكية خالصة للطرف الأول ما لم يُتفق كتابةً على خلاف ذلك.</li><li>يحق للطرف الأول الإشارة إلى المشروع وعرض المخرجات المنشورة ضمن سابقة أعماله (Portfolio) بعد نشرها للجمهور.</li></ol>' +
    '<h3>السرية وعدم الإفصاح</h3><ol><li>يلتزم كل طرف بالحفاظ التام على سرية كافة البيانات التجارية، التسويقية، المالية، وبيانات الدخول المتبادلة، وعدم إفشائها لأي طرف ثالث طوال مدة العقد ولمدة [سنتين] بعد انتهائه.</li></ol>' +
    '<h3>الضمانات وحدود المسؤولية</h3><ol><li>يضمن الطرف الثاني ملكيته أو حيازته للتراخيص القانونية لكافة المواد والعلامات التجارية المسلّمة للطرف الأول، وإخلاء مسؤولية الطرف الأول عن أي مطالبة من الغير بشأنها.</li><li>لا يتحمل أي طرف مسؤولية الأضرار غير المباشرة أو التبعية (بما في ذلك تغيرات خوارزميات المنصات أو نتائج الحملات الإعلانية)، وفي جميع الأحوال لا تتجاوز المسؤولية القصوى قيمة الدفعة الخاصة بدورة العمل محل المطالبة.</li></ol>' +
    '<h3>إنهاء العقد والقوة القاهرة</h3><ol><li>يجوز لأي من الطرفين إنهاء العقد بموجب إخطار كتابي مسبق مدته [١٥] يومًا، أو فورًا في حال إخلال الطرف الآخر بالتزام جوهري وعدم معالجته خلال [٧] أيام عمل من إخطاره.</li><li>عند الإنهاء، تُصفّى الحسابات بحيث يسدد الطرف الثاني قيمة كافة الأعمال المنجزة أو الجاري تنفيذها حتى تاريخ الإنهاء، وتكون الدفعات المقدمة عن دورات العمل التي بدأ تنفيذها غير قابلة للاسترداد.</li><li>لا يُعد أي طرف مخلًا بالتزاماته إذا حال دون تنفيذها ظرف من ظروف القوة القاهرة الخارجة عن الإرادة.</li></ol>' +
    '<h3>القانون الواجب التطبيق وفض النزاعات</h3><ol><li>يخضع هذا العقد ويُفسَّر وفقًا للقوانين السارية، وفي حال نشوء أي خلاف يُحسم وديًا خلال [١٥] يومًا، وإلا اختصت به المحاكم المختصة في <b>[المدينة / الدولة]</b>.</li><li>يمثّل هذا العقد كامل الاتفاق بين الطرفين ويلغي ما سبقه من تفاهمات شفهية أو كتابية.</li></ol>' +
    '<div class="closing"><p><b>وإثباتًا لما تقدم،</b> حُرر هذا العقد من نسختين أصليتين باللغة المعتمدة، بيد كل طرف نسخة للعمل بموجبها، ووقّع الطرفان أدناه على كل صفحة من صفحات العقد.</p></div>'
  )
}

function createBlankScript(): ScriptItemData {
  return {
    title: '',
    format: 'Reel',
    platform: 'Instagram',
    ref: '',
    hook: '',
    script: '',
    cta: '',
    noRef: false,
  }
}

function createBlankDoc(type: 'contract' | 'scripts', lang: 'ar' | 'en'): StudioFullDoc {
  const now = Date.now()
  if (type === 'contract') {
    const title = lang === 'en' ? 'Master Services Agreement' : 'عقد تقديم خدمات احترافية'
    return {
      id: uid(),
      type: 'contract',
      lang,
      name: title,
      folder: null,
      pinned: false,
      created: now,
      updated: now,
      sig: '',
      cover: {
        title,
        sub:
          lang === 'en'
            ? 'A comprehensive commercial agreement governing scope of services, deliverables, payment terms, and intellectual property rights.'
            : 'اتفاقية إطار عمل متكاملة تحدد نطاق الخدمات، التسليمات، الالتزامات المالية، وحقوق الملكية الفكرية بين الطرفين.',
        p1: 'APX',
        p2: '',
        date: todayFormatted(lang),
      },
      body: defaultContractBody(lang),
    }
  }

  const title = lang === 'en' ? 'Content Scripts' : 'سكربتات المحتوى'
  return {
    id: uid(),
    type: 'scripts',
    lang,
    name: title,
    folder: null,
    pinned: false,
    created: now,
    updated: now,
    cover: {
      title,
      sub:
        lang === 'en'
          ? "This month's content scripts (Hook + Script + CTA), ready for review and production."
          : 'سكربتات محتوى الشهر (هوك + سكربت + CTA)، جاهزة للمراجعة والتصوير.',
      client: '',
      month: monthNowFormatted(lang),
      platforms: 'Instagram · TikTok',
    },
    scripts: [createBlankScript(), createBlankScript(), createBlankScript()],
  }
}

function computeDocName(d: StudioFullDoc): string {
  if (d.customName && d.customName.trim()) return d.customName.trim()
  const c = d.cover || {}
  const defaultTitle =
    d.type === 'contract'
      ? d.lang === 'en'
        ? 'Master Services Agreement'
        : 'عقد تقديم خدمات احترافية'
      : d.lang === 'en'
        ? 'Content Scripts'
        : 'سكربتات المحتوى'
  const ti = (c.title || '').trim() || defaultTitle
  const w = (d.type === 'contract' ? c.p2 : c.client || c.month || '').trim()
  return w ? `${ti} — ${w}` : ti
}

// Web Crypto API PBKDF2 + AES-GCM helpers for digital signatures
async function deriveSigKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 200000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toBase64(u8: Uint8Array): string {
  let s = ''
  u8.forEach((b) => {
    s += String.fromCharCode(b)
  })
  return btoa(s)
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function encryptSignatureDataUrl(dataUrl: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveSigKey(password, salt)
  const cipher = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(dataUrl)
  )
  return JSON.stringify({
    s: toBase64(salt),
    i: toBase64(iv),
    c: toBase64(new Uint8Array(cipher)),
  })
}

async function decryptSignatureDataUrl(payload: string, password: string): Promise<string> {
  const parsed = JSON.parse(payload)
  const salt = fromBase64(parsed.s)
  const iv = fromBase64(parsed.i)
  const cipher = fromBase64(parsed.c)
  const key = await deriveSigKey(password, salt)
  const plain = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    cipher as unknown as BufferSource
  )
  return new TextDecoder().decode(plain)
}

// Share link compression / decompression helpers
function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i])
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function packShareDoc(doc: StudioFullDoc): Promise<string> {
  const payload = {
    v: 2,
    t: doc.type,
    l: doc.lang,
    c: doc.cover,
    b: doc.type === 'contract' ? doc.body : undefined,
    s: doc.type === 'scripts' ? doc.scripts : undefined,
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  return `u${toBase64Url(bytes)}`
}

async function unpackShareDoc(encoded: string): Promise<StudioFullDoc | null> {
  try {
    const mode = encoded.charAt(0)
    const bytes = fromBase64Url(encoded.slice(1))
    let jsonStr = ''
    if (mode === 'u') {
      jsonStr = new TextDecoder().decode(bytes)
    } else if (mode === 'z' && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw')
      const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(ds)
      jsonStr = await new Response(stream).text()
    } else {
      return null
    }
    const o = JSON.parse(jsonStr)
    if (!o || (o.t !== 'contract' && o.t !== 'scripts')) return null
    const blank = createBlankDoc(o.t, o.l === 'en' ? 'en' : 'ar')
    blank.cover = { ...blank.cover, ...(o.c || {}) }
    if (o.t === 'contract' && typeof o.b === 'string') {
      blank.body = o.b
    } else if (o.t === 'scripts' && Array.isArray(o.s)) {
      blank.scripts = o.s.map((x: Record<string, unknown>) => ({
        title: String(x.title || ''),
        format: String(x.format || 'Reel'),
        platform: String(x.platform || 'Instagram'),
        ref: String(x.ref || ''),
        hook: String(x.hook || ''),
        script: String(x.script || ''),
        cta: String(x.cta || ''),
        noRef: Boolean(x.nr || x.noRef),
      }))
    }
    blank.name = computeDocName(blank)
    return blank
  } catch {
    return null
  }
}

function parseBulkScriptsText(raw: string): ScriptItemData[] {
  const out: ScriptItemData[] = []
  let cur: ScriptItemData | null = null
  let lastKey: keyof ScriptItemData = 'script'

  const startNew = (title = '') => {
    cur = createBlankScript()
    if (title) cur.title = title
    out.push(cur)
    lastKey = 'script'
  }

  raw
    .replace(/\r/g, '')
    .split('\n')
    .forEach((line) => {
      const l = line.trim()
      if (/^(-{3,}|_{3,}|={3,}|\*{3,})$/.test(l)) {
        cur = null
        return
      }
      const mNum = l.match(/^(?:سكربت|سكريبت|script)\s*#?\s*[0-9٠-٩]+\s*[:\-–.]?\s*(.*)$/i)
      if (mNum) {
        startNew(mNum[1].trim())
        return
      }
      if (!l) return

      const kv = l.match(/^([^:：]{1,24})\s*[:：]\s*(.*)$/)
      let key: 'title' | 'format' | 'platform' | 'ref' | 'hook' | 'script' | 'cta' | null = null
      if (kv && !/^https?$/i.test(kv[1].trim())) {
        const kStr = kv[1].trim()
        if (/^(العنوان|عنوان|title)$/i.test(kStr)) key = 'title'
        else if (/^(النوع|نوع|الفورمات|فورمات|format|type)$/i.test(kStr)) key = 'format'
        else if (/^(المنصة|المنصه|منصة|platform)$/i.test(kStr)) key = 'platform'
        else if (/^(الريفرنس|ريفرنس|المرجع|مرجع|اللينك|لينك|الرابط|رابط|ref|reference|link|url)$/i.test(kStr))
          key = 'ref'
        else if (/^(الهوك|هوك|hook)$/i.test(kStr)) key = 'hook'
        else if (/^(السكربت|سكربت|السكريبت|سكريبت|المحتوى|النص|script|body|copy)$/i.test(kStr))
          key = 'script'
        else if (/^(cta|الدعوة|الأكشن|call\s*to\s*action)$/i.test(kStr)) key = 'cta'
      }

      if (!cur) startNew('')
      const active = cur!
      const val = key && kv ? kv[2].trim() : l

      if (!key && /^https?:\/\/\S+$/i.test(val) && !active.ref) {
        active.ref = val
        return
      }
      if (!key) {
        if (!active.title && !active.hook && !active.script) {
          active.title = val
          return
        }
        key = lastKey === 'noRef' ? 'script' : lastKey
      }

      if (val && key) {
        if (key === 'title' || key === 'format' || key === 'platform' || key === 'ref') {
          active[key] = val
        } else {
          active[key] = active[key] ? `${active[key]}\n${val}` : val
        }
      }
      if (key) {
        lastKey =
          key === 'title' || key === 'format' || key === 'platform' || key === 'ref'
            ? 'script'
            : key
      }
    })

  return out.filter((s) => Boolean(s.title || s.hook || s.script || s.cta))
}

const STORAGE_NS = 'apx-ds-'

export default function AdminDocumentStudioView({
  adminLang,
  mode,
  onDocsSync,
  onRegisterApi,
  standalonePublicMode = false,
}: AdminDocumentStudioViewProps) {
  const [uiLang, setUiLang] = useState<'ar' | 'en'>(adminLang)
  const [docsMap, setDocsMap] = useState<Record<string, StudioFullDoc>>({})
  const [folders, setFolders] = useState<StudioFolder[]>([])
  const [encryptedSig, setEncryptedSig] = useState<string | null>(null)
  const [activeDoc, setActiveDoc] = useState<StudioFullDoc | null>(null)
  const [readOnly, setReadOnly] = useState<boolean>(false)
  const [filter, setFilter] = useState<'all' | 'contract' | 'scripts' | 'pinned'>(mode)
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated')
  const [showOutline, setShowOutline] = useState<boolean>(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Modals state
  const [showSigModal, setShowSigModal] = useState<boolean>(false)
  const [sigPasswordInput, setSigPasswordInput] = useState<string>('')
  const [sigError, setSigError] = useState<string>('')

  const [showSignUnlockModal, setShowSignUnlockModal] = useState<boolean>(false)
  const [unlockPwInput, setUnlockPwInput] = useState<string>('')
  const [unlockError, setUnlockError] = useState<string>('')

  const [showShareModal, setShowShareModal] = useState<boolean>(false)
  const [shareUrl, setShareUrl] = useState<string>('')

  const [showBulkModal, setShowBulkModal] = useState<boolean>(false)
  const [bulkCount, setBulkCount] = useState<number>(4)
  const [bulkText, setBulkText] = useState<string>('')
  const [bulkError, setBulkError] = useState<string>('')

  const [showFolderModal, setShowFolderModal] = useState<boolean>(false)
  const [newFolderName, setNewFolderName] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const contractBodyRef = useRef<HTMLDivElement | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev))
    }, 2800)
  }, [])

  useEffect(() => {
    setUiLang(adminLang)
  }, [adminLang])

  useEffect(() => {
    setFilter(mode)
  }, [mode])

  // Load local & server-synced documents
  useEffect(() => {
    try {
      const rawDocs = localStorage.getItem(`${STORAGE_NS}docs`)
      const rawFolders = localStorage.getItem(`${STORAGE_NS}folders`)
      const rawSig = localStorage.getItem(`${STORAGE_NS}sig`)
      if (rawDocs) setDocsMap(JSON.parse(rawDocs))
      if (rawFolders) setFolders(JSON.parse(rawFolders))
      if (rawSig) setEncryptedSig(rawSig)
    } catch {
      // ignore localStorage read errors
    }

    // Check URL hash for shared document (#s=...)
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#s=')) {
      const encoded = window.location.hash.slice(3)
      unpackShareDoc(encoded).then((sharedDoc) => {
        if (sharedDoc) {
          setActiveDoc(sharedDoc)
          setReadOnly(true)
        }
      })
    }

    if (!standalonePublicMode) {
      fetch('/api/studio', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (!res?.store) return
          if (res.store.docs) {
            try {
              const remoteDocs = JSON.parse(res.store.docs)
              setDocsMap((prev) => {
                const merged = { ...prev }
                Object.keys(remoteDocs).forEach((id) => {
                  if (!merged[id] || (remoteDocs[id].updated || 0) > (merged[id].updated || 0)) {
                    merged[id] = remoteDocs[id]
                  }
                })
                try {
                  localStorage.setItem(`${STORAGE_NS}docs`, JSON.stringify(merged))
                } catch {}
                return merged
              })
            } catch {}
          }
          if (res.store.folders) {
            try {
              const remoteFolders = JSON.parse(res.store.folders)
              if (Array.isArray(remoteFolders)) {
                setFolders(remoteFolders)
                try {
                  localStorage.setItem(`${STORAGE_NS}folders`, JSON.stringify(remoteFolders))
                } catch {}
              }
            } catch {}
          }
          if (res.store.sig) {
            setEncryptedSig(res.store.sig)
            try {
              localStorage.setItem(`${STORAGE_NS}sig`, res.store.sig)
            } catch {}
          }
        })
        .catch(() => null)
    }
  }, [standalonePublicMode])

  const persistDocs = useCallback((nextMap: Record<string, StudioFullDoc>) => {
    setDocsMap(nextMap)
    const str = JSON.stringify(nextMap)
    try {
      localStorage.setItem(`${STORAGE_NS}docs`, str)
    } catch {}
    fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'docs', value: str }),
    }).catch(() => null)
  }, [])

  const persistFolders = useCallback((nextFolders: StudioFolder[]) => {
    setFolders(nextFolders)
    const str = JSON.stringify(nextFolders)
    try {
      localStorage.setItem(`${STORAGE_NS}folders`, str)
    } catch {}
    fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'folders', value: str }),
    }).catch(() => null)
  }, [])

  const sortedDocItems = useMemo((): StudioDocItem[] => {
    const list = Object.values(docsMap)
    list.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', uiLang)
      if (sortBy === 'created') return (b.created || 0) - (a.created || 0)
      return (b.updated || 0) - (a.updated || 0)
    })
    return list.map((d) => ({
      id: d.id,
      type: d.type,
      name: d.name,
      lang: d.lang,
      folder: d.folder,
      pinned: Boolean(d.pinned),
      updated: d.updated,
    }))
  }, [docsMap, sortBy, uiLang])

  useEffect(() => {
    onDocsSync?.(sortedDocItems, activeDoc?.id || null)
  }, [sortedDocItems, activeDoc?.id, onDocsSync])

  const updateActiveDoc = useCallback(
    (updater: (prev: StudioFullDoc) => StudioFullDoc) => {
      setActiveDoc((prev) => {
        if (!prev || readOnly) return prev
        const updated = updater(prev)
        updated.updated = Date.now()
        updated.name = computeDocName(updated)
        setDocsMap((oldMap) => {
          const nextMap = { ...oldMap, [updated.id]: updated }
          const str = JSON.stringify(nextMap)
          try {
            localStorage.setItem(`${STORAGE_NS}docs`, str)
          } catch {}
          fetch('/api/studio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'docs', value: str }),
          }).catch(() => null)
          return nextMap
        })
        return updated
      })
    },
    [readOnly]
  )

  const handleCreateNewDoc = useCallback(
    (docType: 'contract' | 'scripts') => {
      const created = createBlankDoc(docType, uiLang)
      if (folderFilter !== 'all' && folderFilter !== 'none') {
        created.folder = folderFilter
      }
      const nextMap = { ...docsMap, [created.id]: created }
      persistDocs(nextMap)
      setReadOnly(false)
      setActiveDoc(created)
    },
    [docsMap, folderFilter, persistDocs, uiLang]
  )

  const handleDeleteDoc = useCallback(
    (id: string) => {
      const target = docsMap[id]
      if (!target) return
      const nextMap = { ...docsMap }
      delete nextMap[id]
      persistDocs(nextMap)
      if (activeDoc?.id === id) {
        setActiveDoc(null)
      }
      showToast(uiLang === 'ar' ? `تم حذف «${target.name}»` : `Deleted "${target.name}"`)
    },
    [activeDoc?.id, docsMap, persistDocs, showToast, uiLang]
  )

  const handleDuplicateDoc = useCallback(
    (id: string) => {
      const orig = docsMap[id]
      if (!orig) return
      const copy: StudioFullDoc = JSON.parse(JSON.stringify(orig))
      copy.id = uid()
      copy.created = Date.now()
      copy.updated = Date.now()
      copy.pinned = false
      copy.customName = `${orig.name} (${uiLang === 'ar' ? 'نسخة' : 'Copy'})`
      copy.name = copy.customName
      const nextMap = { ...docsMap, [copy.id]: copy }
      persistDocs(nextMap)
      showToast(uiLang === 'ar' ? 'تم تكرار المستند' : 'Document duplicated')
    },
    [docsMap, persistDocs, showToast, uiLang]
  )

  const handleTogglePin = useCallback(
    (id: string) => {
      const orig = docsMap[id]
      if (!orig) return
      const updated = { ...orig, pinned: !orig.pinned, updated: Date.now() }
      persistDocs({ ...docsMap, [id]: updated })
    },
    [docsMap, persistDocs]
  )

  const handleBackupAll = useCallback(() => {
    const payload = {
      apx: 'backup',
      v: 3,
      folders,
      docs: Object.values(docsMap),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `apx-studio-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    showToast(uiLang === 'ar' ? 'تم تنزيل النسخة الاحتياطية' : 'Backup downloaded')
  }, [docsMap, folders, showToast, uiLang])

  const handleExportPdf = useCallback(() => {
    if (!activeDoc) return
    showToast(
      uiLang === 'ar'
        ? 'اختر «Save as PDF» من نافذة الطباعة'
        : 'Choose "Save as PDF" in the print dialog'
    )
    setTimeout(() => {
      window.print()
    }, 220)
  }, [activeDoc, showToast, uiLang])

  const handleShareDoc = useCallback(async () => {
    if (!activeDoc) return
    const packed = await packShareDoc(activeDoc)
    const url = `${window.location.origin}/studio#s=${packed}`
    setShareUrl(url)
    setShowShareModal(true)
  }, [activeDoc])

  // Register bridge API for AdminDashboard sidebar & global shortcuts
  useEffect(() => {
    const api: StudioBridgeApi = {
      newDoc: handleCreateNewDoc,
      setLang: setUiLang,
      home: () => setActiveDoc(null),
      setFilter: (f) => {
        setFilter(f)
        setActiveDoc(null)
      },
      open: (id) => {
        if (docsMap[id]) {
          setReadOnly(false)
          setActiveDoc(docsMap[id])
        }
      },
      del: handleDeleteDoc,
      openSig: () => {
        setSigError('')
        setSigPasswordInput('')
        setShowSigModal(true)
      },
      openCmd: () => {
        window.dispatchEvent(new CustomEvent('apx-open-global-cmd'))
      },
      importTrigger: () => fileInputRef.current?.click(),
      backupAll: handleBackupAll,
      exportPdf: handleExportPdf,
      share: handleShareDoc,
      list: () => sortedDocItems,
    }
    onRegisterApi?.(api)
    return () => onRegisterApi?.(null)
  }, [
    docsMap,
    handleBackupAll,
    handleCreateNewDoc,
    handleDeleteDoc,
    handleExportPdf,
    handleShareDoc,
    onRegisterApi,
    sortedDocItems,
  ])

  // Sync contract HTML into contentEditable when switching documents
  useEffect(() => {
    if (activeDoc?.type === 'contract' && contractBodyRef.current) {
      if (contractBodyRef.current.innerHTML !== (activeDoc.body || '')) {
        contractBodyRef.current.innerHTML = activeDoc.body || ''
      }
    }
  }, [activeDoc?.id, activeDoc?.type, activeDoc?.lang])

  // Initialize signature canvas when signature modal opens
  useEffect(() => {
    if (!showSigModal || !sigCanvasRef.current) return
    const cv = sigCanvasRef.current
    const ctx = cv.getContext('2d')
    if (!ctx) return
    cv.width = cv.clientWidth * 2
    cv.height = cv.clientHeight * 2
    ctx.setTransform(2, 0, 0, 2, 0, 0)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#181420'
  }, [showSigModal])

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return Object.values(docsMap)
      .filter((d) => {
        if (q && !(d.name || '').toLowerCase().includes(q)) return false
        if (filter === 'pinned' && !d.pinned) return false
        if ((filter === 'contract' || filter === 'scripts') && d.type !== filter) return false
        if (folderFilter === 'none' && d.folder) return false
        if (folderFilter !== 'all' && folderFilter !== 'none' && d.folder !== folderFilter)
          return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', uiLang)
        if (sortBy === 'created') return (b.created || 0) - (a.created || 0)
        return (b.updated || 0) - (a.updated || 0)
      })
  }, [docsMap, filter, folderFilter, searchQuery, sortBy, uiLang])

  const handleImportJson = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    let importedCount = 0
    const nextMap = { ...docsMap }
    const nextFolders = [...folders]

    for (let i = 0; i < files.length; i++) {
      try {
        const text = await files[i].text()
        const parsed = JSON.parse(text)
        const list: StudioFullDoc[] =
          parsed?.apx === 'doc' && parsed.doc
            ? [parsed.doc]
            : parsed?.apx === 'backup' && Array.isArray(parsed.docs)
              ? parsed.docs
              : []
        if (Array.isArray(parsed?.folders)) {
          parsed.folders.forEach((f: StudioFolder) => {
            if (f?.id && f?.name && !nextFolders.some((x) => x.id === f.id)) {
              nextFolders.push({ id: f.id, name: f.name, open: true })
            }
          })
        }
        list.forEach((d) => {
          if (d && (d.type === 'contract' || d.type === 'scripts')) {
            const id = d.id || uid()
            nextMap[id] = {
              ...d,
              id,
              updated: d.updated || Date.now(),
              name: computeDocName(d),
            }
            importedCount++
          }
        })
      } catch {
        // ignore invalid file
      }
    }

    if (importedCount > 0) {
      persistFolders(nextFolders)
      persistDocs(nextMap)
      showToast(
        uiLang === 'ar' ? `تم استيراد ${importedCount} ملف` : `Imported ${importedCount} file(s)`
      )
    } else {
      showToast(uiLang === 'ar' ? 'الملف غير صالح' : 'Invalid APX studio file')
    }
  }

  const handleAddContractClause = () => {
    if (!activeDoc || activeDoc.type !== 'contract' || !contractBodyRef.current) return
    const cb = contractBodyRef.current
    const h = document.createElement('h3')
    const ol = document.createElement('ol')
    const li = document.createElement('li')
    const isEn = activeDoc.lang === 'en'
    h.textContent = isEn ? 'New Clause' : 'بند جديد'
    li.textContent = isEn
      ? '[Sub-clause details and obligations]'
      : '[تفاصيل البند والالتزامات المتفق عليها]'
    ol.appendChild(li)
    const closing = cb.querySelector('.closing')
    if (closing) {
      cb.insertBefore(h, closing)
      cb.insertBefore(ol, closing)
    } else {
      cb.appendChild(h)
      cb.appendChild(ol)
    }
    updateActiveDoc((prev) => ({ ...prev, body: cb.innerHTML }))
    h.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSaveEncryptedSignature = async () => {
    if (sigPasswordInput.length < 6) {
      setSigError(
        uiLang === 'ar'
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
          : 'Password must be at least 6 characters'
      )
      return
    }
    const cv = sigCanvasRef.current
    if (!cv) return
    const dataUrl = cv.toDataURL('image/png')
    try {
      const encrypted = await encryptSignatureDataUrl(dataUrl, sigPasswordInput)
      setEncryptedSig(encrypted)
      try {
        localStorage.setItem(`${STORAGE_NS}sig`, encrypted)
      } catch {}
      fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'sig', value: encrypted }),
      }).catch(() => null)
      setShowSigModal(false)
      showToast(
        uiLang === 'ar' ? 'تم حفظ الإمضاء مشفرة بنجاح' : 'Encrypted signature saved'
      )
    } catch {
      setSigError(uiLang === 'ar' ? 'تعذر تشفير الإمضاء' : 'Encryption failed')
    }
  }

  const handleApplySignatureToContract = async () => {
    if (!encryptedSig) return
    try {
      const dataUrl = await decryptSignatureDataUrl(encryptedSig, unlockPwInput)
      updateActiveDoc((prev) => ({ ...prev, sig: dataUrl }))
      setShowSignUnlockModal(false)
      setUnlockPwInput('')
      showToast(uiLang === 'ar' ? 'تم توقيع صفحات العقد' : 'Signed on all contract pages')
    } catch {
      setUnlockError(uiLang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password')
    }
  }

  const isRtl = uiLang === 'ar'

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="apx-doc-studio min-h-[760px] rounded-3xl bg-[#0A070E] border border-[#E2D9F3]/10 overflow-hidden relative"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(e) => {
          handleImportJson(e.target.files)
          e.target.value = ''
        }}
      />

      {/* ====================================================================
          HOME VIEW (Contracts & Scripts Dashboard)
         ==================================================================== */}
      {!activeDoc ? (
        <div className="p-6 sm:p-8 space-y-7 apx-studio-no-print">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2D9F3]/10 pb-6">
            <div>
              <span className="eyebrow block mb-1.5">APX DOCUMENT STUDIO · NATIVE TSX</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isRtl
                  ? filter === 'contract'
                    ? 'استوديو العقود القانونية'
                    : filter === 'scripts'
                      ? 'استوديو سكربتات المحتوى'
                      : 'استوديو العقود والسكربتات'
                  : filter === 'contract'
                    ? 'Legal Contracts Studio'
                    : filter === 'scripts'
                      ? 'Content Scripts Studio'
                      : 'Contracts & Scripts Studio'}
              </h2>
              <p className="text-xs sm:text-sm text-[#9388A8] mt-1 max-w-2xl">
                {isRtl
                  ? 'أنشئ عقودك القانونية وسكربتات المحتوى الشهرية بهوية APX، وقّعها رقمياً بتشفير AES-GCM، وصدّرها PDF أو شاركها برابط مباشر.'
                  : 'Create commercial contracts and monthly content scripts in the APX identity, sign with AES-GCM encryption, and export to A4 PDF or share via link.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSigError('')
                  setSigPasswordInput('')
                  setShowSigModal(true)
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/15 text-xs font-bold text-[#E2D9F3] transition-all"
              >
                <PenTool className="w-4 h-4 text-[#A78BFA]" />
                <span>{isRtl ? 'إعداد الإمضاء المشفرة' : 'Encrypted Signature'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/15 text-xs font-bold text-[#E2D9F3] transition-all"
              >
                <Upload className="w-4 h-4 text-[#A78BFA]" />
                <span>{isRtl ? 'استيراد JSON' : 'Import JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleBackupAll}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/15 text-xs font-bold text-[#E2D9F3] transition-all"
              >
                <Archive className="w-4 h-4 text-[#A78BFA]" />
                <span>{isRtl ? 'نسخة احتياطية' : 'Backup All'}</span>
              </button>
            </div>
          </div>

          {/* Quick Create Hero Cards (Harmonious Non-Garish Gradients) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleCreateNewDoc('contract')}
              className="group relative overflow-hidden rounded-2xl p-6 text-start border border-[#E2D9F3]/15 bg-gradient-to-br from-[#35205E] via-[#241540] to-[#150C26] hover:border-[#8B5CF6]/50 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-en font-bold tracking-widest uppercase bg-black/30 border border-white/15 text-[#E2D9F3]">
                  CONTRACT · A4
                </span>
                <FileText className="w-5 h-5 text-[#C4B5FD]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5">
                {isRtl ? 'عقد جديد' : 'New Contract'}
              </h3>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/75 leading-relaxed mb-4">
                {isRtl
                  ? 'غلاف رسمي، بنود قانونية بمعايير العقود العالمية، وخانة توقيع للطرفين في كل صفحة.'
                  : 'Executive cover page, international commercial clauses, and dual party signature blocks on every page.'}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD] group-hover:text-white">
                <span>{isRtl ? 'ابدأ كتابة العقد' : 'Create Contract'}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNewDoc('scripts')}
              className="group relative overflow-hidden rounded-2xl p-6 text-start border border-[#E2D9F3]/15 bg-gradient-to-br from-[#2D1C52] via-[#1F1338] to-[#120A21] hover:border-[#8B5CF6]/50 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-en font-bold tracking-widest uppercase bg-black/30 border border-white/15 text-[#E2D9F3]">
                  SCRIPTS · A4
                </span>
                <Film className="w-5 h-5 text-[#C4B5FD]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5">
                {isRtl ? 'ملف سكربتات جديد' : 'New Scripts File'}
              </h3>
              <p className="text-xs sm:text-sm text-[#E2D9F3]/75 leading-relaxed mb-4">
                {isRtl
                  ? 'محتوى الشهر كاملًا في ملف واحد: غلاف، فهرس تفاعلي، وصفحة مستقلة لكل سكربت (هوك + سكربت + CTA + ريفرنس).'
                  : 'Full monthly content plan in one file: cover, interactive index, and dedicated A4 sheet per script (Hook + Script + CTA + Reference).'}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD] group-hover:text-white">
                <span>{isRtl ? 'ابدأ كتابة السكربتات' : 'Create Scripts File'}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#120D1A] p-1.5 rounded-2xl border border-[#E2D9F3]/10 text-xs">
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All' },
                  { id: 'contract', ar: 'العقود', en: 'Contracts' },
                  { id: 'scripts', ar: 'السكربتات', en: 'Scripts' },
                  { id: 'pinned', ar: 'المثبتة', en: 'Pinned' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                    filter === tab.id
                      ? 'bg-[#7C5CE6] text-white'
                      : 'text-[#9388A8] hover:text-white'
                  }`}
                >
                  {isRtl ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9388A8] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في العقود والسكربتات...' : 'Search files...'}
                  className="ps-9 pe-3.5 py-2 rounded-xl bg-[#140F1D] border border-[#E2D9F3]/12 text-xs text-white focus:outline-none focus:border-[#7C5CE6]"
                />
              </div>

              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#140F1D] border border-[#E2D9F3]/12 text-xs text-white"
              >
                <option value="all">{isRtl ? 'كل الفولدرات' : 'All Folders'}</option>
                <option value="none">{isRtl ? 'بدون فولدر' : 'Unfiled'}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setNewFolderName('')
                  setShowFolderModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#140F1D] hover:bg-[#1E162B] border border-[#E2D9F3]/12 text-xs font-bold text-[#C4B5FD]"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'فولدر جديد' : 'New Folder'}</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'name' | 'created')}
                className="px-3 py-2 rounded-xl bg-[#140F1D] border border-[#E2D9F3]/12 text-xs text-white"
              >
                <option value="updated">{isRtl ? 'الأحدث تعديلاً' : 'Last Updated'}</option>
                <option value="created">{isRtl ? 'الأحدث إنشاءً' : 'Newest Created'}</option>
                <option value="name">{isRtl ? 'الاسم' : 'Name'}</option>
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocs.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-[#E2D9F3]/15 text-center text-sm text-[#9388A8]">
              {isRtl
                ? 'لا توجد ملفات حالياً. ابدأ بإنشاء عقد جديد أو ملف سكربتات من الأعلى.'
                : 'No documents found. Start by creating a contract or scripts file above.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => {
                const scriptCount = doc.type === 'scripts' ? (doc.scripts || []).length : 0
                const folderObj = folders.find((f) => f.id === doc.folder)
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setReadOnly(false)
                      setActiveDoc(doc)
                    }}
                    className="group relative rounded-2xl bg-[#120D1B] border border-[#E2D9F3]/10 hover:border-[#7C5CE6]/45 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                  >
                    <div
                      className={`p-4 aspect-[16/9] flex flex-col justify-between relative overflow-hidden ${
                        doc.type === 'contract'
                          ? 'bg-gradient-to-br from-[#35205E] to-[#190E2E]'
                          : 'bg-gradient-to-br from-[#2B1B4E] to-[#140B26]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-en font-bold tracking-widest uppercase bg-white/10 border border-white/20 text-white">
                          {doc.type === 'contract' ? 'CONTRACT' : 'SCRIPTS'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-en font-bold bg-black/30 text-[#E2D9F3]">
                          {doc.lang.toUpperCase()}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-end justify-between gap-2">
                        <p className="text-sm font-bold text-white line-clamp-2">
                          {doc.cover?.title || doc.name}
                        </p>
                        {scriptCount > 0 && (
                          <span className="font-en text-2xl font-bold text-white/85 shrink-0">
                            {pad2(scriptCount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-[#9388A8] mt-0.5">
                          {folderObj && (
                            <span className="inline-flex items-center gap-1 text-[#C4B5FD]">
                              <Folder className="w-3 h-3" />
                              {folderObj.name}
                            </span>
                          )}
                          <span>
                            {new Date(doc.updated).toLocaleDateString(
                              isRtl ? 'ar-EG' : 'en-GB',
                              { month: 'short', day: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePin(doc.id)}
                          title={isRtl ? 'تثبيت' : 'Pin'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            doc.pinned
                              ? 'text-[#C4B5FD] bg-[#7C5CE6]/20'
                              : 'text-[#9388A8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateDoc(doc.id)}
                          title={isRtl ? 'تكرار' : 'Duplicate'}
                          className="p-1.5 rounded-lg text-[#9388A8] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          title={isRtl ? 'حذف' : 'Delete'}
                          className="p-1.5 rounded-lg text-[#D8949E] hover:bg-[#B86B77]/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ====================================================================
            EDITOR + A4 LIVE PREVIEW STAGE
           ==================================================================== */
        <div className="flex flex-col min-h-[760px]">
          {/* Sticky Editor Toolbar */}
          <div className="sticky top-0 z-20 bg-[#0D0914]/95 backdrop-blur-xl border-b border-[#E2D9F3]/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 apx-studio-no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              {!standalonePublicMode && (
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#E2D9F3]"
                >
                  {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  <span>{isRtl ? 'كل الملفات' : 'All Files'}</span>
                </button>
              )}

              <input
                type="text"
                disabled={readOnly}
                value={activeDoc.customName ?? activeDoc.name}
                onChange={(e) => {
                  const val = e.target.value
                  updateActiveDoc((prev) => ({
                    ...prev,
                    customName: val,
                    name: val.trim() || computeDocName({ ...prev, customName: '' }),
                  }))
                }}
                className="px-3 py-1.5 rounded-xl bg-[#140F1D] border border-[#E2D9F3]/12 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#7C5CE6] min-w-[180px] sm:min-w-[240px]"
              />

              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8ED1B0] px-2 py-0.5 rounded-full bg-[#5E9E7E]/15 border border-[#5E9E7E]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#68AD8D]" />
                {readOnly
                  ? isRtl
                    ? 'للعرض فقط'
                    : 'View Only'
                  : isRtl
                    ? 'محفوظ تلقائياً'
                    : 'Auto-saved'}
              </span>
            </div>

            {/* Formatting & Document Controls */}
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeDoc.type === 'contract' && (
                  <>
                    <div className="flex items-center gap-1 bg-[#140F1D] p-1 rounded-xl border border-[#E2D9F3]/10">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          document.execCommand('bold')
                        }}
                        title={isRtl ? 'خط عريض' : 'Bold'}
                        className="p-1.5 rounded-lg hover:bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          document.execCommand('formatBlock', false, 'h3')
                        }}
                        title={isRtl ? 'عنوان بند' : 'Clause Heading'}
                        className="p-1.5 rounded-lg hover:bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          document.execCommand('insertOrderedList')
                        }}
                        title={isRtl ? 'بند فرعي مرقم' : 'Numbered Sub-clause'}
                        className="p-1.5 rounded-lg hover:bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          document.execCommand('insertUnorderedList')
                        }}
                        title={isRtl ? 'قائمة نقطية' : 'Bullet List'}
                        className="p-1.5 rounded-lg hover:bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddContractClause}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#E2D9F3]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{isRtl ? 'إضافة بند' : 'Add Clause'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeDoc.sig) {
                          updateActiveDoc((prev) => ({ ...prev, sig: '' }))
                          showToast(isRtl ? 'تم إزالة التوقيع' : 'Signature removed')
                        } else if (!encryptedSig) {
                          setSigError('')
                          setSigPasswordInput('')
                          setShowSigModal(true)
                        } else {
                          setUnlockError('')
                          setUnlockPwInput('')
                          setShowSignUnlockModal(true)
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#C4B5FD]"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>
                        {activeDoc.sig
                          ? isRtl
                            ? 'إزالة التوقيع'
                            : 'Remove Signature'
                          : isRtl
                            ? 'توقيع العقد'
                            : 'Sign Contract'}
                      </span>
                    </button>
                  </>
                )}

                {activeDoc.type === 'scripts' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveDoc((prev) => ({
                          ...prev,
                          scripts: [...(prev.scripts || []), createBlankScript()],
                        }))
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#E2D9F3]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{isRtl ? 'إضافة سكربت' : 'Add Script'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBulkError('')
                        setBulkText('')
                        setShowBulkModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#C4B5FD]"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إضافة دفعة سكربتات' : 'Batch Add Scripts'}</span>
                    </button>
                  </>
                )}

                {/* Document Language Switcher */}
                <div className="flex items-center bg-[#140F1D] p-0.5 rounded-xl border border-[#E2D9F3]/12 text-xs">
                  {(['ar', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        if (activeDoc.lang === l) return
                        updateActiveDoc((prev) => {
                          const next = { ...prev, lang: l }
                          if (prev.type === 'contract') {
                            const replaceConfirm = window.confirm(
                              isRtl
                                ? `هل تريد استبدال نص العقد بالقالب ${l === 'ar' ? 'العربي' : 'الإنجليزي'} أيضاً؟`
                                : `Also replace contract body with the ${l === 'ar' ? 'Arabic' : 'English'} template?`
                            )
                            if (replaceConfirm) {
                              next.body = defaultContractBody(l)
                              next.cover = {
                                ...next.cover,
                                title:
                                  l === 'en'
                                    ? 'Master Services Agreement'
                                    : 'عقد تقديم خدمات احترافية',
                                date: todayFormatted(l),
                              }
                            }
                          }
                          return next
                        })
                      }}
                      className={`px-2.5 py-1 rounded-lg font-en font-bold transition-all ${
                        activeDoc.lang === l
                          ? 'bg-[#7C5CE6] text-white'
                          : 'text-[#9388A8] hover:text-white'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right Actions: Outline, Share, Export PDF */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowOutline((p) => !p)}
                className="px-2.5 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#E2D9F3]"
              >
                {isRtl ? 'الفهرس الجانبي' : 'Outline'}
              </button>

              {!readOnly && (
                <button
                  type="button"
                  onClick={handleShareDoc}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17121E] hover:bg-[#211A2B] border border-[#E2D9F3]/12 text-xs font-bold text-[#E2D9F3]"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>{isRtl ? 'مشاركة برابط' : 'Share Link'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7C5CE6] to-[#593896] hover:brightness-110 text-xs font-bold text-white shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>
            </div>
          </div>

          {/* Main Stage + Optional Outline Sidebar */}
          <div className="flex-1 flex min-h-0">
            <div className="stage flex-1">
              <div
                className="pages"
                dir={activeDoc.lang === 'en' ? 'ltr' : 'rtl'}
                lang={activeDoc.lang}
              >
                {/* ==========================================================
                    1. CONTRACT A4 RENDERER
                   ========================================================== */}
                {activeDoc.type === 'contract' && (
                  <>
                    {/* Contract A4 Cover Page */}
                    <section className="page cv cv-c dark" id="studio-cover">
                      <ApxVectorMark className="wm" />
                      <div className="cv-top">
                        <div className="cv-brand">
                          <ApxVectorMark />
                          <b>APX</b>
                        </div>
                        <span className="chip">
                          {activeDoc.lang === 'en' ? 'CONTRACT' : 'CONTRACT · عقد'}
                        </span>
                      </div>

                      <div className="cv-mid">
                        <div className="eyebrow">Master Services Agreement</div>
                        <h1
                          contentEditable={!readOnly}
                          suppressContentEditableWarning
                          data-ph={activeDoc.lang === 'en' ? 'Contract Title' : 'عنوان العقد'}
                          className="ed"
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent || ''
                            updateActiveDoc((prev) => ({
                              ...prev,
                              cover: { ...prev.cover, title: text },
                            }))
                          }}
                        >
                          {activeDoc.cover.title}
                        </h1>
                        <p
                          contentEditable={!readOnly}
                          suppressContentEditableWarning
                          data-ph={activeDoc.lang === 'en' ? 'Short description' : 'وصف قصير'}
                          className="ed sub"
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent || ''
                            updateActiveDoc((prev) => ({
                              ...prev,
                              cover: { ...prev.cover, sub: text },
                            }))
                          }}
                        >
                          {activeDoc.cover.sub}
                        </p>
                      </div>

                      <div className="cv-meta">
                        {[
                          {
                            key: 'p1',
                            label: activeDoc.lang === 'en' ? 'First Party' : 'الطرف الأول',
                            ph: activeDoc.lang === 'en' ? 'Company name' : 'اسم الشركة',
                          },
                          {
                            key: 'p2',
                            label: activeDoc.lang === 'en' ? 'Second Party' : 'الطرف الثاني',
                            ph: activeDoc.lang === 'en' ? 'Client name' : 'اسم العميل',
                          },
                          {
                            key: 'date',
                            label: activeDoc.lang === 'en' ? 'Effective Date' : 'تاريخ العقد',
                            ph: activeDoc.lang === 'en' ? 'Date' : 'التاريخ',
                          },
                        ].map((meta) => (
                          <div key={meta.key} className="mi">
                            <label>{meta.label}</label>
                            <div
                              contentEditable={!readOnly}
                              suppressContentEditableWarning
                              data-ph={meta.ph}
                              className="ed"
                              onBlur={(e) => {
                                const text = e.currentTarget.textContent || ''
                                updateActiveDoc((prev) => ({
                                  ...prev,
                                  cover: { ...prev.cover, [meta.key]: text },
                                }))
                              }}
                            >
                              {activeDoc.cover[meta.key] || ''}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="cv-bot">
                        <span>zyadmohamed.com</span>
                        <span>
                          {activeDoc.lang === 'en' ? 'Confidential' : 'Confidential · سري'}
                        </span>
                      </div>
                    </section>

                    {/* Contract Body A4 Sheet with Repeating Header & Dual Signature Footer */}
                    <table className="sheet c-sheet">
                      <thead>
                        <tr>
                          <td>
                            <div className="hd">
                              <ApxVectorMark />
                              <span className="wn">APX</span>
                              <span className="dl">
                                {activeDoc.cover.title ||
                                  (activeDoc.lang === 'en'
                                    ? 'Master Services Agreement'
                                    : 'عقد تقديم خدمات احترافية')}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="bd">
                              <div
                                ref={contractBodyRef}
                                contentEditable={!readOnly}
                                suppressContentEditableWarning
                                className="contract"
                                onBlur={(e) => {
                                  const html = e.currentTarget.innerHTML
                                  updateActiveDoc((prev) => ({ ...prev, body: html }))
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>
                            <div className="c-sigs">
                              <div className="cs-col">
                                <div className="cs-top">
                                  <span className="cs-role">
                                    {activeDoc.lang === 'en'
                                      ? 'FIRST PARTY'
                                      : 'FIRST PARTY · الطرف الأول'}
                                  </span>
                                  <span className="cs-name">{activeDoc.cover.p1 || 'APX'}</span>
                                </div>
                                <div className="cs-row">
                                  <span className="cs-lbl">
                                    {activeDoc.lang === 'en' ? 'Signature:' : 'التوقيع:'}
                                  </span>
                                  <span className="cs-line">
                                    {activeDoc.sig ? (
                                      <img src={activeDoc.sig} alt="First Party Signature" />
                                    ) : null}
                                  </span>
                                </div>
                              </div>
                              <div className="cs-col">
                                <div className="cs-top">
                                  <span className="cs-role">
                                    {activeDoc.lang === 'en'
                                      ? 'SECOND PARTY'
                                      : 'SECOND PARTY · الطرف الثاني'}
                                  </span>
                                  <span className="cs-name">
                                    {activeDoc.cover.p2 ||
                                      (activeDoc.lang === 'en' ? 'Client Name' : 'اسم العميل')}
                                  </span>
                                </div>
                                <div className="cs-row">
                                  <span className="cs-lbl">
                                    {activeDoc.lang === 'en' ? 'Signature:' : 'التوقيع:'}
                                  </span>
                                  <span className="cs-line" />
                                </div>
                              </div>
                            </div>
                            <div className="ft">
                              <span className="lt">zyadmohamed.com</span>
                              <span className="fn">
                                {activeDoc.lang === 'en' ? 'Confidential' : 'سري وملزم'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                )}

                {/* ==========================================================
                    2. SCRIPTS A4 RENDERER (Cover + Index + Per-Script Sheets)
                   ========================================================== */}
                {activeDoc.type === 'scripts' && (
                  <>
                    {/* Scripts Cover Page */}
                    <section className="page cv cv-s dark" id="studio-cover">
                      <ApxVectorMark className="wm" />
                      <div className="cv-top">
                        <div className="cv-brand">
                          <ApxVectorMark />
                          <b>APX</b>
                        </div>
                        <span className="chip">
                          {activeDoc.lang === 'en' ? 'SCRIPTS' : 'SCRIPTS · سكربتات'}
                        </span>
                      </div>

                      <div className="cv-mid">
                        <div className="eyebrow">Content Scripts</div>
                        <h1
                          contentEditable={!readOnly}
                          suppressContentEditableWarning
                          data-ph={activeDoc.lang === 'en' ? 'File Title' : 'عنوان الملف'}
                          className="ed"
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent || ''
                            updateActiveDoc((prev) => ({
                              ...prev,
                              cover: { ...prev.cover, title: text },
                            }))
                          }}
                        >
                          {activeDoc.cover.title}
                        </h1>
                        <p
                          contentEditable={!readOnly}
                          suppressContentEditableWarning
                          data-ph={activeDoc.lang === 'en' ? 'Short description' : 'وصف قصير'}
                          className="ed sub"
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent || ''
                            updateActiveDoc((prev) => ({
                              ...prev,
                              cover: { ...prev.cover, sub: text },
                            }))
                          }}
                        >
                          {activeDoc.cover.sub}
                        </p>
                        <div className="count">
                          <b>{pad2((activeDoc.scripts || []).length)}</b>
                          <span>
                            {activeDoc.lang === 'en' ? 'scripts' : 'سكربتات جاهزة للتصوير'}
                          </span>
                        </div>
                      </div>

                      <div className="cv-meta">
                        {[
                          {
                            key: 'client',
                            label: activeDoc.lang === 'en' ? 'Client' : 'العميل',
                            ph: activeDoc.lang === 'en' ? 'Client name' : 'اسم العميل',
                          },
                          {
                            key: 'month',
                            label: activeDoc.lang === 'en' ? 'Month' : 'الشهر',
                            ph: activeDoc.lang === 'en' ? 'Month' : 'الشهر',
                          },
                          {
                            key: 'platforms',
                            label: activeDoc.lang === 'en' ? 'Platforms' : 'المنصات',
                            ph: 'Instagram · TikTok',
                          },
                        ].map((meta) => (
                          <div key={meta.key} className="mi">
                            <label>{meta.label}</label>
                            <div
                              contentEditable={!readOnly}
                              suppressContentEditableWarning
                              data-ph={meta.ph}
                              className="ed"
                              onBlur={(e) => {
                                const text = e.currentTarget.textContent || ''
                                updateActiveDoc((prev) => ({
                                  ...prev,
                                  cover: { ...prev.cover, [meta.key]: text },
                                }))
                              }}
                            >
                              {activeDoc.cover[meta.key] || ''}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="cv-bot">
                        <span>zyadmohamed.com</span>
                        <span>Content Plan</span>
                      </div>
                    </section>

                    {/* Scripts Index Sheet */}
                    <table className="sheet ix-sheet" id="studio-index">
                      <thead>
                        <tr>
                          <td>
                            <div className="hd">
                              <ApxVectorMark />
                              <span className="wn">APX</span>
                              <span className="dl">
                                {[activeDoc.cover.title, activeDoc.cover.client]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="bd">
                              <div className="ix">
                                <div className="eyebrow">Index</div>
                                <h2>
                                  {activeDoc.lang === 'en' ? 'Scripts Index' : 'فهرس السكربتات'}
                                </h2>
                                <div>
                                  {(activeDoc.scripts || []).map((scr, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        document
                                          .getElementById(`studio-script-${idx}`)
                                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                      }}
                                      className="ix-row"
                                    >
                                      <span className="n">{pad2(idx + 1)}</span>
                                      <span className={`t ${scr.title ? '' : 'text-[#9388A8]'}`}>
                                        {scr.title ||
                                          (activeDoc.lang === 'en' ? 'Untitled' : 'بدون عنوان')}
                                      </span>
                                      <span className="f">{scr.format || 'Reel'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>
                            <div className="ft">
                              <span className="lt">zyadmohamed.com</span>
                              <span className="fn">{activeDoc.cover.month}</span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Individual Script A4 Sheets */}
                    {(activeDoc.scripts || []).map((scr, idx) => (
                      <table
                        key={idx}
                        id={`studio-script-${idx}`}
                        className="sheet scr-sheet"
                      >
                        <thead>
                          <tr>
                            <td>
                              <div className="hd">
                                <ApxVectorMark />
                                <span className="wn">APX</span>
                                <span className="dl">
                                  {[activeDoc.cover.title, activeDoc.cover.client]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div className="bd">
                                <article className="scr">
                                  {!readOnly && (
                                    <div className="flex items-center justify-end gap-1.5 mb-1 apx-studio-no-print">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => {
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            const [item] = copy.splice(idx, 1)
                                            copy.splice(idx - 1, 0, item)
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                        className="p-1.5 rounded-lg border border-[#e6e0f0] text-[#6c637e] hover:text-[#432371] disabled:opacity-30"
                                        title={isRtl ? 'للأعلى' : 'Move Up'}
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === (activeDoc.scripts || []).length - 1}
                                        onClick={() => {
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            const [item] = copy.splice(idx, 1)
                                            copy.splice(idx + 1, 0, item)
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                        className="p-1.5 rounded-lg border border-[#e6e0f0] text-[#6c637e] hover:text-[#432371] disabled:opacity-30"
                                        title={isRtl ? 'للأسفل' : 'Move Down'}
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            copy.splice(idx + 1, 0, { ...scr })
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                        className="p-1.5 rounded-lg border border-[#e6e0f0] text-[#6c637e] hover:text-[#432371]"
                                        title={isRtl ? 'تكرار' : 'Duplicate'}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if ((activeDoc.scripts || []).length <= 1) {
                                            showToast(
                                              isRtl
                                                ? 'يجب الإبقاء على سكربت واحد على الأقل'
                                                : 'Keep at least one script'
                                            )
                                            return
                                          }
                                          updateActiveDoc((prev) => ({
                                            ...prev,
                                            scripts: (prev.scripts || []).filter(
                                              (_, i) => i !== idx
                                            ),
                                          }))
                                        }}
                                        className="p-1.5 rounded-lg border border-[#e6e0f0] text-[#b86b77] hover:bg-[#b86b77]/10"
                                        title={isRtl ? 'حذف' : 'Delete'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  <header className="scr-h">
                                    <div className="scr-n">{pad2(idx + 1)}</div>
                                    <div className="tt">
                                      <h2
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning
                                        data-ph={
                                          activeDoc.lang === 'en'
                                            ? 'Script Title'
                                            : 'عنوان السكربت'
                                        }
                                        className="ed"
                                        onBlur={(e) => {
                                          const val = e.currentTarget.textContent || ''
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            copy[idx] = { ...copy[idx], title: val }
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                      >
                                        {scr.title}
                                      </h2>
                                      <div className="chips">
                                        <span className="tg">
                                          <label>Format</label>
                                          <span
                                            contentEditable={!readOnly}
                                            suppressContentEditableWarning
                                            data-ph="Reel"
                                            className="ed"
                                            onBlur={(e) => {
                                              const val = e.currentTarget.textContent || ''
                                              updateActiveDoc((prev) => {
                                                const copy = [...(prev.scripts || [])]
                                                copy[idx] = { ...copy[idx], format: val }
                                                return { ...prev, scripts: copy }
                                              })
                                            }}
                                          >
                                            {scr.format}
                                          </span>
                                        </span>
                                        <span className="tg">
                                          <label>Platform</label>
                                          <span
                                            contentEditable={!readOnly}
                                            suppressContentEditableWarning
                                            data-ph="Instagram"
                                            className="ed"
                                            onBlur={(e) => {
                                              const val = e.currentTarget.textContent || ''
                                              updateActiveDoc((prev) => {
                                                const copy = [...(prev.scripts || [])]
                                                copy[idx] = { ...copy[idx], platform: val }
                                                return { ...prev, scripts: copy }
                                              })
                                            }}
                                          >
                                            {scr.platform}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </header>

                                  {/* Reference Link Box */}
                                  <div className="blk">
                                    <div className="ref-box">
                                      <Link2 className="w-4 h-4 text-[#593896] shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-en font-bold uppercase tracking-wider text-[#432371]">
                                          REFERENCE ·{' '}
                                          <span>
                                            {activeDoc.lang === 'en'
                                              ? 'Format Reference URL (Optional)'
                                              : 'لينك ريفرنس الفورمات (اختياري)'}
                                          </span>
                                        </div>
                                        <div
                                          contentEditable={!readOnly}
                                          suppressContentEditableWarning
                                          dir="ltr"
                                          data-ph="https://www.instagram.com/reel/..."
                                          className="ed text-xs font-en text-[#432371] truncate"
                                          onBlur={(e) => {
                                            const val = e.currentTarget.textContent || ''
                                            updateActiveDoc((prev) => {
                                              const copy = [...(prev.scripts || [])]
                                              copy[idx] = { ...copy[idx], ref: val.trim() }
                                              return { ...prev, scripts: copy }
                                            })
                                          }}
                                        >
                                          {scr.ref}
                                        </div>
                                      </div>
                                      {scr.ref && (
                                        <a
                                          href={
                                            /^https?:\/\//i.test(scr.ref)
                                              ? scr.ref
                                              : `https://${scr.ref}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded-lg border border-[#e6e0f0] text-[#432371] hover:bg-[#f5f3fa]"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* 01 · HOOK */}
                                  <div className="blk">
                                    <div className="hook">
                                      <div className="sec-hd">
                                        <span className="sec-badge">01 · HOOK</span>
                                        <span className="sec-sub">
                                          {activeDoc.lang === 'en'
                                            ? 'The opening line that stops the scroll'
                                            : 'الهوك — الجملة الافتتاحية التي توقف السكرول'}
                                        </span>
                                      </div>
                                      <div
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning
                                        data-ph={
                                          activeDoc.lang === 'en'
                                            ? 'Write the opening hook in the first 3 seconds...'
                                            : 'اكتب أول جملة تشد المشاهد في أول ٣ ثوانٍ...'
                                        }
                                        className="ed"
                                        onBlur={(e) => {
                                          const val = e.currentTarget.innerText || ''
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            copy[idx] = { ...copy[idx], hook: val }
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                      >
                                        {scr.hook}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 02 · SCRIPT */}
                                  <div className="blk">
                                    <div className="script-box">
                                      <div className="sec-hd">
                                        <span className="sec-badge">02 · SCRIPT</span>
                                        <span className="sec-sub">
                                          {activeDoc.lang === 'en'
                                            ? 'Full video script & spoken copy'
                                            : 'السكربت — النص الكامل للفيديو'}
                                        </span>
                                      </div>
                                      <div
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning
                                        data-ph={
                                          activeDoc.lang === 'en'
                                            ? 'Write the complete script body here...'
                                            : 'اكتب نص السكربت كاملاً هنا...'
                                        }
                                        className="ed"
                                        onBlur={(e) => {
                                          const val = e.currentTarget.innerText || ''
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            copy[idx] = { ...copy[idx], script: val }
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                      >
                                        {scr.script}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 03 · CTA */}
                                  <div className="blk">
                                    <div className="cta-box">
                                      <div className="sec-hd">
                                        <span className="sec-badge">03 · CTA</span>
                                        <span className="sec-sub">
                                          {activeDoc.lang === 'en'
                                            ? 'Call to Action — What viewers should do next'
                                            : 'الـ CTA — المطلوب من المشاهد'}
                                        </span>
                                      </div>
                                      <div
                                        contentEditable={!readOnly}
                                        suppressContentEditableWarning
                                        data-ph={
                                          activeDoc.lang === 'en'
                                            ? 'e.g. DM us the word "START" or click the link in bio...'
                                            : 'مثلاً: ارسل كلمة «ابدأ» في الرسائل أو اضغط على الرابط في البايو...'
                                        }
                                        className="ed"
                                        onBlur={(e) => {
                                          const val = e.currentTarget.innerText || ''
                                          updateActiveDoc((prev) => {
                                            const copy = [...(prev.scripts || [])]
                                            copy[idx] = { ...copy[idx], cta: val }
                                            return { ...prev, scripts: copy }
                                          })
                                        }}
                                      >
                                        {scr.cta}
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>
                              <div className="ft">
                                <span className="lt">zyadmohamed.com</span>
                                <span className="fn">{activeDoc.cover.month}</span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Outline Side Panel */}
            {showOutline && (
              <aside className="w-60 bg-[#100C16] border-s border-[#E2D9F3]/10 p-4 hidden xl:flex flex-col justify-between apx-studio-no-print">
                <div className="space-y-2 overflow-y-auto">
                  <span className="text-[10px] font-en font-bold uppercase tracking-widest text-[#9388A8] block px-2">
                    {isRtl ? 'محتويات المستند' : 'Document Outline'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById('studio-cover')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="w-full text-start px-3 py-2 rounded-xl text-xs font-bold text-[#E2D9F3] hover:bg-[#17121E]"
                  >
                    {isRtl ? '٠٠ · الغلاف' : '00 · Cover Page'}
                  </button>
                  {activeDoc.type === 'scripts' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('studio-index')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                        className="w-full text-start px-3 py-2 rounded-xl text-xs font-bold text-[#E2D9F3] hover:bg-[#17121E]"
                      >
                        {isRtl ? '٠١ · فهرس السكربتات' : '01 · Scripts Index'}
                      </button>
                      {(activeDoc.scripts || []).map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            document
                              .getElementById(`studio-script-${i}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                          className="w-full text-start px-3 py-1.5 rounded-xl text-xs text-[#9388A8] hover:text-white hover:bg-[#17121E] truncate"
                        >
                          <span className="font-en font-bold text-[#A78BFA] me-1.5">
                            {pad2(i + 1)}
                          </span>
                          {s.title || (isRtl ? 'بدون عنوان' : 'Untitled')}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeDoc.type === 'contract') {
                        handleAddContractClause()
                      } else {
                        updateActiveDoc((prev) => ({
                          ...prev,
                          scripts: [...(prev.scripts || []), createBlankScript()],
                        }))
                      }
                    }}
                    className="mt-4 w-full py-2 rounded-xl border border-dashed border-[#E2D9F3]/20 hover:border-[#7C5CE6] text-xs font-bold text-[#C4B5FD] flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {activeDoc.type === 'contract'
                        ? isRtl
                          ? 'إضافة بند جديد'
                          : 'Add Clause'
                        : isRtl
                          ? 'إضافة سكربت جديد'
                          : 'Add Script'}
                    </span>
                  </button>
                )}
              </aside>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ENCRYPTED DIGITAL SIGNATURE SETUP (AES-GCM + PBKDF2)
         ==================================================================== */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 apx-studio-no-print">
          <div className="w-full max-w-md rounded-2xl bg-[#140F1D] border border-[#E2D9F3]/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isRtl ? 'الإمضاء الرقمية المشفرة' : 'Encrypted Digital Signature'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSigModal(false)}
                className="text-[#9388A8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#9388A8]">
              {isRtl
                ? 'ارسم توقيعك أو ارفع صورة شفافة له. يتم تشفيره بمعيار AES-GCM بكلمة مرور خاصة بك.'
                : 'Draw your signature or upload a PNG image. It is encrypted with AES-GCM using your password.'}
            </p>

            <canvas
              ref={sigCanvasRef}
              onPointerDown={(e) => {
                const cv = sigCanvasRef.current
                const ctx = cv?.getContext('2d')
                if (!cv || !ctx) return
                isDrawingRef.current = true
                cv.setPointerCapture(e.pointerId)
                const rect = cv.getBoundingClientRect()
                ctx.beginPath()
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
              }}
              onPointerMove={(e) => {
                if (!isDrawingRef.current) return
                const cv = sigCanvasRef.current
                const ctx = cv?.getContext('2d')
                if (!cv || !ctx) return
                const rect = cv.getBoundingClientRect()
                ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                ctx.stroke()
              }}
              onPointerUp={() => {
                isDrawingRef.current = false
              }}
              className="w-full h-36 bg-white rounded-xl cursor-crosshair touch-none"
            />

            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const cv = sigCanvasRef.current
                  const ctx = cv?.getContext('2d')
                  if (cv && ctx) ctx.clearRect(0, 0, cv.width, cv.height)
                }}
                className="px-3 py-1.5 rounded-lg bg-[#211A2B] text-[#E2D9F3]"
              >
                {isRtl ? 'مسح اللوحة' : 'Clear Pad'}
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const img = new Image()
                    img.onload = () => {
                      const cv = sigCanvasRef.current
                      const ctx = cv?.getContext('2d')
                      if (!cv || !ctx) return
                      ctx.clearRect(0, 0, cv.width, cv.height)
                      const w = cv.clientWidth
                      const h = cv.clientHeight
                      const scale = Math.min(w / img.width, h / img.height)
                      ctx.drawImage(
                        img,
                        (w - img.width * scale) / 2,
                        (h - img.height * scale) / 2,
                        img.width * scale,
                        img.height * scale
                      )
                    }
                    img.src = String(reader.result)
                  }
                  reader.readAsDataURL(f)
                }}
                className="text-xs text-[#9388A8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E2D9F3] mb-1">
                {isRtl ? 'كلمة مرور تشفير التوقيع (6 أحرف على الأقل)' : 'Signature Password'}
              </label>
              <input
                type="password"
                value={sigPasswordInput}
                onChange={(e) => setSigPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-white text-xs"
              />
            </div>

            {sigError && <p className="text-xs text-[#D8949E] font-bold">{sigError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSigModal(false)}
                className="px-4 py-2 rounded-xl bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEncryptedSignature}
                className="px-5 py-2 rounded-xl bg-[#7C5CE6] text-xs font-bold text-white"
              >
                {isRtl ? 'حفظ التوقيع مشفراً' : 'Save Encrypted Signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: UNLOCK & SIGN CONTRACT
         ==================================================================== */}
      {showSignUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 apx-studio-no-print">
          <div className="w-full max-w-sm rounded-2xl bg-[#140F1D] border border-[#E2D9F3]/15 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {isRtl ? 'تأكيد توقيع العقد' : 'Confirm Contract Signing'}
            </h3>
            <p className="text-xs text-[#9388A8]">
              {isRtl
                ? 'أدخل كلمة مرور الإمضاء لإدراج توقيعك على جميع صفحات العقد.'
                : 'Enter your signature password to sign all pages of this contract.'}
            </p>
            <input
              type="password"
              value={unlockPwInput}
              onChange={(e) => setUnlockPwInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplySignatureToContract()
              }}
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-white text-sm"
            />
            {unlockError && <p className="text-xs text-[#D8949E] font-bold">{unlockError}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSignUnlockModal(false)}
                className="px-4 py-2 rounded-xl bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplySignatureToContract}
                className="px-5 py-2 rounded-xl bg-[#7C5CE6] text-xs font-bold text-white"
              >
                {isRtl ? 'توقيع الآن' : 'Sign Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: BATCH ADD / PASTE SCRIPTS
         ==================================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 apx-studio-no-print">
          <div className="w-full max-w-lg rounded-2xl bg-[#140F1D] border border-[#E2D9F3]/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isRtl ? 'إضافة مجموعة سكربتات دفعة واحدة' : 'Batch Add Content Scripts'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-[#9388A8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E2D9F3] mb-1">
                {isRtl ? 'عدد السكربتات الفارغة (في حال عدم اللصق)' : 'Number of Empty Scripts'}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E2D9F3] mb-1">
                {isRtl
                  ? 'أو الصق سكربتات الشهر كاملةً (يتم تقسيم الهوك والسكربت والـ CTA تلقائياً)'
                  : 'Or Paste Full Month Scripts (Auto-splits Hook, Script, CTA & Reference)'}
              </label>
              <textarea
                rows={7}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  isRtl
                    ? 'سكربت 1: عنوان السكربت\nالهوك: جملة الهوك...\nالسكربت: نص الفيديو...\nCTA: ابعت كلمة...\n---'
                    : 'Script 1: Title\nHook: Opening hook...\nScript: Full body...\nCTA: DM us...\n---'
                }
                className="w-full p-3 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-white text-xs leading-relaxed"
              />
            </div>

            {bulkError && <p className="text-xs text-[#D8949E] font-bold">{bulkError}</p>}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const raw = bulkText.trim()
                  let items: ScriptItemData[] = []
                  if (raw) {
                    items = parseBulkScriptsText(raw)
                    if (items.length === 0) {
                      setBulkError(
                        isRtl
                          ? 'لم يتم العثور على سكربتات صالحة في النص'
                          : 'Could not parse scripts from text'
                      )
                      return
                    }
                  } else {
                    items = Array.from({ length: bulkCount }, () => createBlankScript())
                  }
                  updateActiveDoc((prev) => ({
                    ...prev,
                    scripts: [...(prev.scripts || []), ...items],
                  }))
                  setShowBulkModal(false)
                  showToast(
                    isRtl ? `تمت إضافة ${items.length} سكربت` : `Added ${items.length} scripts`
                  )
                }}
                className="px-5 py-2 rounded-xl bg-[#7C5CE6] text-xs font-bold text-white"
              >
                {isRtl ? 'إضافة السكربتات' : 'Add Scripts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: SHAREABLE LINK
         ==================================================================== */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 apx-studio-no-print">
          <div className="w-full max-w-md rounded-2xl bg-[#140F1D] border border-[#E2D9F3]/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isRtl ? 'مشاركة المستند برابط مباشر' : 'Share Document Link'}
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-[#9388A8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#9388A8]">
              {isRtl
                ? 'أي شخص لديه هذا الرابط يمكنه استعراض المستند وتنزيله كملف PDF.'
                : 'Anyone with this link can view the document and export it as PDF.'}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                dir="ltr"
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-xs font-en text-white"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  showToast(isRtl ? 'تم نسخ الرابط' : 'Link copied')
                }}
                className="px-4 py-2 rounded-xl bg-[#7C5CE6] text-xs font-bold text-white shrink-0"
              >
                {isRtl ? 'نسخ' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: NEW FOLDER
         ==================================================================== */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 apx-studio-no-print">
          <div className="w-full max-w-sm rounded-2xl bg-[#140F1D] border border-[#E2D9F3]/15 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {isRtl ? 'إنشاء فولدر جديد' : 'Create New Folder'}
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={isRtl ? 'اسم الفولدر...' : 'Folder name...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A070E] border border-[#E2D9F3]/15 text-white text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 rounded-xl bg-[#211A2B] text-xs font-bold text-[#E2D9F3]"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newFolderName.trim()) return
                  const next = [
                    ...folders,
                    { id: uid(), name: newFolderName.trim().slice(0, 60), open: true },
                  ]
                  persistFolders(next)
                  setShowFolderModal(false)
                }}
                className="px-5 py-2 rounded-xl bg-[#7C5CE6] text-xs font-bold text-white"
              >
                {isRtl ? 'إنشاء' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#E2D9F3] text-[#140E1C] text-xs sm:text-sm font-bold shadow-2xl apx-studio-no-print">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
