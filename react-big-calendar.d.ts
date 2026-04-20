declare module 'react-big-calendar' {
  import { ReactNode } from 'react';

  export interface Event {
    title: string;
    start: Date;
    end: Date;
    [key: string]: any;
  }

  export interface CalendarProps {
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export class Calendar extends React.Component<CalendarProps> {}

  export function momentLocalizer(moment: any): any;
}
