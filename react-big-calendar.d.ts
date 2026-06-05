declare module 'react-big-calendar' {
  export interface Event {
    title: string;
    start: Date;
    end: Date;
    [key: string]: unknown;
  }

  export interface CalendarProps {
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export class Calendar extends React.Component<CalendarProps> {}

  export function momentLocalizer(moment: unknown): unknown;
}
