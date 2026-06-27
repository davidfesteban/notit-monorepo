import { filterNotes, groupByDate, monthKey, monthYearLabel } from './calendarUtils.js'

export function createCalendarState(notesState) {
  let search = $state('')
  let visualization = $state('calendar')
  let selectedMonth = $state(monthValue(new Date()))

  const searchNotes = $derived(filterNotes(notesState.notes, search))
  const filteredNotes = $derived(selectedMonth === 'all' ? searchNotes : searchNotes.filter((note) => monthKey(note.updatedDate) === selectedMonth))
  const groups = $derived(groupByDate(filteredNotes))
  const currentMonth = $derived(selectedMonth === 'all' ? 'All notes' : monthYearLabel(`${selectedMonth}-01T00:00:00`))

  function toggleVisualization() {
    visualization = visualization === 'calendar' ? 'constellation' : 'calendar'
  }

  return {
    get search() { return search },
    set search(value) { search = value },
    get visualization() { return visualization },
    get selectedMonth() { return selectedMonth },
    set selectedMonth(value) { selectedMonth = value || 'all' },
    get filteredNotes() { return filteredNotes },
    get searchNotes() { return searchNotes },
    get groups() { return groups },
    get monthLabel() { return currentMonth },
    toggleVisualization,
  }
}

function monthValue(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
