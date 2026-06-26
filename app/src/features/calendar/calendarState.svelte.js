import { filterNotes, groupByDate, monthYearLabel } from './calendarUtils.js'

export function createCalendarState(notesState) {
  let search = $state('')
  let visualization = $state('calendar')
  let selectedMonth = $state(monthValue(new Date()))

  const filteredNotes = $derived(filterNotes(notesState.notes, search))
  const groups = $derived(groupByDate(filteredNotes))
  const currentMonth = $derived(monthYearLabel(`${selectedMonth}-01T00:00:00`))

  function toggleVisualization() {
    visualization = visualization === 'calendar' ? 'constellation' : 'calendar'
  }

  return {
    get search() { return search },
    set search(value) { search = value },
    get visualization() { return visualization },
    get selectedMonth() { return selectedMonth },
    set selectedMonth(value) { selectedMonth = value || monthValue(new Date()) },
    get filteredNotes() { return filteredNotes },
    get groups() { return groups },
    get monthLabel() { return currentMonth },
    toggleVisualization,
  }
}

function monthValue(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
