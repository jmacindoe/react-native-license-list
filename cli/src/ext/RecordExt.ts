import "array-flat-polyfill"

// Functions missing from JS records aka objects
export const RecordExt = {
  /// Map over the record's values, leaving keys unchanged
  mapValues: function<T, O>(
    record: Record<string, T>,
    mapper: (t: T) => O,
  ): Record<string, O> {
    return Object.assign(
      {},
      ...Object.keys(record).map(k => ({ [k]: mapper(record[k]) })),
    )
  },

  /// filter entries based on the values
  filterValues: function<T, O extends T>(
    record: Record<string, T>,
    filter: (t: T) => t is O,
  ): Record<string, O> {
    return Object.assign(
      {},
      ...Object.keys(record).flatMap(k =>
        filter(record[k]) ? [{ [k]: record[k] }] : [],
      ),
    )
  },

  /// remove values when the transformer returns null, otherwise map them
  compactMapValues: function<T, O>(
    record: Record<string, T>,
    transformer: (t: T) => O | null,
  ): Record<string, O> {
    return RecordExt.filterValues(
      RecordExt.mapValues(record, transformer),
      valueIsDefined,
    )
  },
}

function valueIsDefined<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) {
    return false
  } else {
    return true
  }
}
