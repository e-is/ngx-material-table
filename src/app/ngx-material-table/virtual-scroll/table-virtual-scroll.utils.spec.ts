import {
  DEFAULT_TABLE_ROW_HEIGHT,
  ROW_HEIGHT_TOLERANCE_PX,
  TABLE_ROW_HEIGHT_CSS_VAR,
  computeRowCollapsed,
  createTableRowTrackBy,
  isRowHeightDrifted,
  isRowIndexOutsideRange,
  measureRenderedRowHeight,
  parseCssPixelValue,
  readVirtualRowHeight,
  tableRowTrackBy,
} from './table-virtual-scroll.utils';

describe('table virtual scroll utils', () => {
  describe('parseCssPixelValue', () => {
    it('parses a pixel value', () => {
      expect(parseCssPixelValue('34px')).toBe(34);
      expect(parseCssPixelValue(' 48.5px ')).toBe(48.5);
    });

    it('returns null on anything that is not a pixel value', () => {
      expect(parseCssPixelValue('')).toBeNull();
      expect(parseCssPixelValue(null)).toBeNull();
      expect(parseCssPixelValue(undefined)).toBeNull();
      expect(parseCssPixelValue('calc(34px + 2px)')).toBeNull();
      expect(parseCssPixelValue('2rem')).toBeNull();
    });
  });

  describe('readVirtualRowHeight', () => {
    it('reads the row height from the computed --mat-row-height of the given element', () => {
      const host = document.createElement('div');
      host.style.setProperty(TABLE_ROW_HEIGHT_CSS_VAR, '48px');
      document.body.appendChild(host);

      try {
        expect(readVirtualRowHeight(host)).toBe(48);
      } finally {
        document.body.removeChild(host);
      }
    });

    it('inherits the variable from an ancestor, like a table container does', () => {
      const container = document.createElement('div');
      container.style.setProperty(TABLE_ROW_HEIGHT_CSS_VAR, '33px');
      const host = document.createElement('div');
      container.appendChild(host);
      document.body.appendChild(container);

      try {
        expect(readVirtualRowHeight(host)).toBe(33);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('falls back when the variable is not set, or is not a pixel value', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);

      try {
        expect(readVirtualRowHeight(host)).toBe(DEFAULT_TABLE_ROW_HEIGHT);

        host.style.setProperty(TABLE_ROW_HEIGHT_CSS_VAR, 'calc(1rem + 2px)');
        expect(readVirtualRowHeight(host)).toBe(DEFAULT_TABLE_ROW_HEIGHT);

        expect(readVirtualRowHeight(host, 48)).toBe(48);
      } finally {
        document.body.removeChild(host);
      }
    });
  });

  describe('measureRenderedRowHeight', () => {
    it('measures the first rendered row, for both table forms', () => {
      const host = document.createElement('div');
      host.innerHTML = '<mat-row style="display:block;height:34px"></mat-row>';
      document.body.appendChild(host);

      try {
        expect(measureRenderedRowHeight(host)).toBe(34);
      } finally {
        document.body.removeChild(host);
      }
    });

    it('returns null when no row is rendered', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);

      try {
        expect(measureRenderedRowHeight(host)).toBeNull();
      } finally {
        document.body.removeChild(host);
      }
    });
  });

  describe('isRowHeightDrifted', () => {
    it('tolerates a one pixel difference', () => {
      expect(isRowHeightDrifted(35, 34)).toBeFalse();
      expect(isRowHeightDrifted(33, 34)).toBeFalse();
      expect(ROW_HEIGHT_TOLERANCE_PX).toBe(1);
    });

    it('detects a divergence above the tolerance', () => {
      expect(isRowHeightDrifted(3, 34)).toBeTrue();
      expect(isRowHeightDrifted(58, 34)).toBeTrue();
    });
  });

  describe('isRowIndexOutsideRange', () => {
    const range = { start: 10, end: 20 };

    it('treats the range end as exclusive', () => {
      expect(isRowIndexOutsideRange(19, range)).toBeFalse();
      expect(isRowIndexOutsideRange(20, range)).toBeTrue();
    });

    it('detects an index before the window', () => {
      expect(isRowIndexOutsideRange(9, range)).toBeTrue();
      expect(isRowIndexOutsideRange(10, range)).toBeFalse();
    });

    it('is never outside of an unknown or empty range', () => {
      expect(isRowIndexOutsideRange(5, null)).toBeFalse();
      expect(isRowIndexOutsideRange(5, { start: 0, end: 0 })).toBeTrue();
    });
  });

  describe('computeRowCollapsed', () => {
    it('collapses a focused row when focus rows are enabled', () => {
      expect(computeRowCollapsed(true, true, false)).toBeTrue();
    });

    it('never collapses a row of a virtualised table', () => {
      expect(computeRowCollapsed(true, true, true)).toBeFalse();
    });

    it('does not collapse a row that is not focused', () => {
      expect(computeRowCollapsed(true, false, false)).toBeFalse();
      expect(computeRowCollapsed(false, true, false)).toBeFalse();
    });
  });

  describe('row identity', () => {
    const identityOf = (row: any) => tableRowTrackBy(0, row);

    it('uses the current data id, which is not renumbered', () => {
      const row = { id: 3, currentData: { id: 42 } };
      expect(identityOf(row)).toBe(42);
    });

    it('keeps the identity of a row when its row id is renumbered', () => {
      const before = { id: 3, currentData: { id: 42 } };
      const after = { id: 4, currentData: { id: 42 } };

      expect(identityOf(before)).toBe(identityOf(after));
    });

    it('uses the row instance for a new or unsaved row (id === -1)', () => {
      const newRow = { id: -1, currentData: { id: -1 } };
      expect(identityOf(newRow)).toBe(newRow);
    });

    it('distinguishes two unsaved rows', () => {
      const first = { id: -1, currentData: {} };
      const second = { id: -1, currentData: {} };

      expect(identityOf(first)).not.toBe(identityOf(second));
    });

    it('accepts a custom identity accessor', () => {
      const trackBy = createTableRowTrackBy<any>((row) => row.currentData.code);
      expect(trackBy(0, { id: 7, currentData: { code: 'ABC' } })).toBe('ABC');
    });

    it('falls back to the index for an undefined row', () => {
      expect(tableRowTrackBy(5, undefined)).toBe(5);
    });
  });
});
