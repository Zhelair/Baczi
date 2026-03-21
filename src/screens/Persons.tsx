import { useState, useRef } from 'react'
import { Users, Plus, Download, Trash2, X, Check, User } from 'lucide-react'
import {
  loadPersons, addPerson, deletePerson, exportProject,
  importProject, type PersonProfile, type BaziProject,
} from '../utils/storage'
import type { Language, UserProfile, Gender } from '../engine/types'

interface Props {
  ownProfile: UserProfile
  lang: Language
  activePersonId: string | null
  onActivate: (personId: string | null) => void
  onViewTab: (tab: 'today' | 'chart') => void
}

const L = {
  title:         { bg: 'Хора',            ru: 'Люди',           en: 'People'         },
  subtitle:      { bg: 'Запазени профили', ru: 'Сохранённые профили', en: 'Saved profiles' },
  you:           { bg: 'Вие',             ru: 'Вы',             en: 'You'             },
  addPerson:     { bg: '+ Добави',         ru: '+ Добавить',     en: '+ Add Person'    },
  importProject: { bg: '↑ Импортирай',    ru: '↑ Импорт',       en: '↑ Import'        },
  viewChart:     { bg: 'Вижте картата',   ru: 'Смотреть карту', en: 'View Chart'      },
  download:      { bg: '↓ Проект',        ru: '↓ Проект',       en: '↓ Project'       },
  delete:        { bg: 'Изтрий',          ru: 'Удалить',        en: 'Delete'          },
  viewing:       { bg: 'Виждате картата на', ru: 'Смотрите карту', en: 'Viewing chart of' },
  backToMine:    { bg: '← Обратно към моята', ru: '← К своей', en: '← Back to mine'  },
  noPersons:     { bg: 'Няма запазени хора', ru: 'Нет сохранённых людей', en: 'No saved people yet' },
  noPersonsSub:  { bg: 'Добавете клиенти или познати, за да анализирате техните карти', ru: 'Добавьте клиентов или знакомых для анализа их карт', en: 'Add clients or friends to analyze their charts' },
  active:        { bg: 'Активен',          ru: 'Активен',        en: 'Active'          },
  name:          { bg: 'Имe',             ru: 'Имя',            en: 'Name'            },
  dob:           { bg: 'Рождена дата',    ru: 'Дата рождения',  en: 'Date of birth'   },
  gender:        { bg: 'Пол',             ru: 'Пол',            en: 'Gender'          },
  male:          { bg: 'Мъж',             ru: 'Мужской',        en: 'Male'            },
  female:        { bg: 'Жена',            ru: 'Женский',        en: 'Female'          },
  hour:          { bg: 'Час (незадълж.)', ru: 'Час (необяз.)',  en: 'Hour (optional)' },
  note:          { bg: 'Бележка',         ru: 'Заметка',        en: 'Note'            },
  save:          { bg: 'Запази',          ru: 'Сохранить',      en: 'Save'            },
  cancel:        { bg: 'Отмени',          ru: 'Отмена',         en: 'Cancel'          },
  importSuccess: { bg: '✓ Импортиран. Добавен към списъка.', ru: '✓ Импортирован. Добавлен в список.', en: '✓ Imported. Added to list.' },
  importError:   { bg: 'Невалиден файл.', ru: 'Неверный файл.', en: 'Invalid file.'   },
  downloadOwn:   { bg: '↓ Изтегли моя проект', ru: '↓ Скачать мой проект', en: '↓ Download My Project' },
}

function l(key: keyof typeof L, lang: Language): string {
  return L[key][lang] ?? L[key]['en']
}

function dobStr(p: PersonProfile | UserProfile) {
  return `${String(p.birthDay).padStart(2,'0')}.${String(p.birthMonth).padStart(2,'0')}.${p.birthYear}${
    p.birthHour !== null && p.birthHour !== undefined
      ? ` ${String(p.birthHour).padStart(2,'0')}:${String(p.birthMinute ?? 0).padStart(2,'0')}`
      : ''
  }`
}

interface AddFormState {
  name: string; year: string; month: string; day: string
  hour: string; gender: Gender; note: string
}

const defaultForm = (): AddFormState => ({
  name: '', year: '', month: '', day: '', hour: '', gender: 'female', note: ''
})

export default function Persons({ ownProfile, lang, activePersonId, onActivate, onViewTab }: Props) {
  const [persons, setPersons] = useState<PersonProfile[]>(() => loadPersons())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddFormState>(defaultForm())
  const [importMsg, setImportMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const y = parseInt(form.year), m = parseInt(form.month), d = parseInt(form.day)
    if (!form.name.trim() || isNaN(y) || isNaN(m) || isNaN(d)) return

    // Parse hour as HH:MM or plain number
    let birthHour: number | null = null
    let birthMinute: number | null = null
    if (form.hour.trim()) {
      const colonIdx = form.hour.indexOf(':')
      if (colonIdx !== -1) {
        birthHour = parseInt(form.hour.slice(0, colonIdx))
        birthMinute = parseInt(form.hour.slice(colonIdx + 1))
      } else {
        birthHour = parseInt(form.hour)
        birthMinute = 0
      }
      if (isNaN(birthHour) || birthHour < 0 || birthHour > 23) { birthHour = null; birthMinute = null }
      if (birthMinute !== null && (isNaN(birthMinute) || birthMinute < 0 || birthMinute > 59)) birthMinute = 0
    }

    const person = addPerson({
      name: form.name.trim(),
      birthYear: y, birthMonth: m, birthDay: d,
      birthHour, birthMinute,
      gender: form.gender,
      note: form.note.trim() || undefined,
    })
    setPersons(loadPersons())
    setForm(defaultForm())
    setShowForm(false)
    // Auto-activate the new person
    onActivate(person.id)
  }

  function handleDelete(id: string) {
    deletePerson(id)
    setPersons(loadPersons())
    if (activePersonId === id) onActivate(null)
    setDeleteConfirm(null)
  }

  function downloadPersonProject(person: PersonProfile) {
    // Export own project data but swap the profile to this person
    const p: UserProfile = {
      name: person.name, birthYear: person.birthYear, birthMonth: person.birthMonth,
      birthDay: person.birthDay, birthHour: person.birthHour, birthMinute: person.birthMinute,
      gender: person.gender, language: lang,
      birthCity: person.birthCity, birthLongitude: person.birthLongitude,
      birthLatitude: person.birthLatitude, birthUtcOffset: person.birthUtcOffset,
    }
    const project = exportProject(p)
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bazi-${person.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadOwnProject() {
    const project = exportProject(ownProfile)
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bazi-${ownProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BaziProject
        if (!data.profile?.name) { setImportMsg(l('importError', lang)); return }
        // Add this person to the saved list
        const person = addPerson({
          name: data.profile.name,
          birthYear: data.profile.birthYear, birthMonth: data.profile.birthMonth,
          birthDay: data.profile.birthDay, birthHour: data.profile.birthHour,
          birthMinute: data.profile.birthMinute, gender: data.profile.gender,
          birthCity: data.profile.birthCity, birthLongitude: data.profile.birthLongitude,
          birthLatitude: data.profile.birthLatitude, birthUtcOffset: data.profile.birthUtcOffset,
        })
        // Merge history/notes/sessions from project
        importProject(data)
        setPersons(loadPersons())
        setImportMsg(l('importSuccess', lang))
        onActivate(person.id)
        setTimeout(() => setImportMsg(''), 3000)
      } catch {
        setImportMsg(l('importError', lang))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const activePerson = activePersonId ? persons.find(p => p.id === activePersonId) : null

  return (
    <div className="bz-page">
      {/* Active person banner */}
      {activePerson && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-amber-500 font-medium">{l('viewing', lang)}</p>
              <p className="text-sm font-semibold text-amber-400">{activePerson.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onViewTab('today') }}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors"
            >
              {lang === 'bg' ? 'Виж четенето' : lang === 'ru' ? 'Смотреть' : 'View Reading'}
            </button>
            <button
              onClick={() => onActivate(null)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {l('backToMine', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Users size={22} className="text-amber-400" />
            {l('title', lang)}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{l('subtitle', lang)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >
            {l('importProject', lang)}
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            {l('addPerson', lang)}
          </button>
        </div>
      </div>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      {importMsg && (
        <div className="mb-4 text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-700/40 rounded-xl px-3 py-2">
          <Check size={12} /> {importMsg}
        </div>
      )}

      {/* Add person form */}
      {showForm && (
        <div className="mb-6 bz-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-200">{l('addPerson', lang)}</h3>
            <button onClick={() => setShowForm(false)} className="text-zinc-600 hover:text-zinc-400"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">{l('name', lang)}</label>
              <input
                autoFocus
                type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder={lang === 'bg' ? 'Пълно иле' : lang === 'ru' ? 'Полное имя' : 'Full name'}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">{l('dob', lang)}</label>
              <div className="flex gap-1">
                <input type="number" placeholder="DD" min={1} max={31} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors text-center" />
                <input type="number" placeholder="MM" min={1} max={12} value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors text-center" />
                <input type="number" placeholder="YYYY" min={1900} max={2099} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors text-center" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">{l('hour', lang)}</label>
              <input type="text" placeholder="16:30" value={form.hour} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">{l('gender', lang)}</label>
              <div className="flex gap-2">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                    className={`flex-1 py-2 rounded-xl border text-sm transition-colors ${
                      form.gender === g ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}>
                    {l(g, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">{l('note', lang)}</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder={lang === 'bg' ? 'Напр. Клиент, приятел...' : lang === 'ru' ? 'Напр. клиент, друг...' : 'e.g. Client, friend...'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.name.trim() || !form.year || !form.month || !form.day}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors">
              {l('save', lang)}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
              {l('cancel', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Your own profile card */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{l('you', lang)}</p>
        <div className={`bz-card p-4 flex items-center gap-4 ${!activePersonId ? 'border-amber-500/30' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 font-bold text-sm">{ownProfile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-zinc-100">{ownProfile.name}</p>
              {!activePersonId && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                  {l('active', lang)}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">{dobStr(ownProfile)} · {lang === 'bg' ? (ownProfile.gender === 'male' ? 'Мъж' : 'Жена') : lang === 'ru' ? (ownProfile.gender === 'male' ? 'Мужской' : 'Женский') : (ownProfile.gender === 'male' ? 'Male' : 'Female')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activePersonId && (
              <button onClick={() => onActivate(null)}
                className="text-xs px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors">
                {lang === 'bg' ? 'Активирай' : lang === 'ru' ? 'Активировать' : 'Switch'}
              </button>
            )}
            <button onClick={downloadOwnProject}
              className="text-xs px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1">
              <Download size={11} />
              {lang === 'bg' ? 'Проект' : lang === 'ru' ? 'Проект' : 'Project'}
            </button>
          </div>
        </div>
      </div>

      {/* Saved persons */}
      {persons.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{l('noPersons', lang)}</p>
          <p className="text-xs mt-1 text-zinc-700">{l('noPersonsSub', lang)}</p>
        </div>
      ) : (
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            {lang === 'bg' ? 'Запазени' : lang === 'ru' ? 'Сохранённые' : 'Saved'} ({persons.length})
          </p>
          <div className="space-y-2">
            {persons.map(person => {
              const isActive = activePersonId === person.id
              return (
                <div key={person.id} className={`bz-card p-4 flex items-center gap-4 ${isActive ? 'border-amber-500/40' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    <span className={`font-bold text-sm ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-100">{person.name}</p>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                          {l('active', lang)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {dobStr(person)} · {lang === 'bg' ? (person.gender === 'male' ? 'Мъж' : 'Жена') : lang === 'ru' ? (person.gender === 'male' ? 'Мужской' : 'Женский') : (person.gender === 'male' ? 'Male' : 'Female')}
                    </p>
                    {person.note && <p className="text-xs text-zinc-600 mt-0.5 italic">{person.note}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isActive ? (
                      <button
                        onClick={() => { onActivate(person.id); onViewTab('today') }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-medium transition-colors"
                      >
                        {lang === 'bg' ? 'Виж' : lang === 'ru' ? 'Смотреть' : 'View'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onActivate(null)}
                        className="text-xs px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {l('backToMine', lang)}
                      </button>
                    )}
                    <button onClick={() => downloadPersonProject(person)}
                      className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors" title={l('download', lang)}>
                      <Download size={13} />
                    </button>
                    {deleteConfirm === person.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(person.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(person.id)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
