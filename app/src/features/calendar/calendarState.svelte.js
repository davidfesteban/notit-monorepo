import { filterNotes, groupByDate, monthYearLabel } from './calendarUtils.js'

export function createCalendarState(notesState) {
  let search = $state('')
  let visualization = $state('calendar')

  const filteredNotes = $derived(filterNotes(notesState.notes, search))
  const groups = $derived(groupByDate(filteredNotes))
  const currentMonth = $derived(monthYearLabel(filteredNotes[0]?.updatedDate || new Date().toISOString()))

  function toggleVisualization() {
    visualization = visualization === 'calendar' ? 'constellation' : 'calendar'
  }

  return {
    get search() { return search },
    set search(value) { search = value },
    get visualization() { return visualization },
    get filteredNotes() { return filteredNotes },
    get groups() { return groups },
    get monthLabel() { return currentMonth },
    toggleVisualization,
  }
}
