export type Observer<TEvent> = (event: TEvent) => void;

export class Observable<TEvent> {
  private observers = new Set<Observer<TEvent>>();

  subscribe(observer: Observer<TEvent>) {
    this.observers.add(observer);

    return () => {
      this.observers.delete(observer);
    };
  }

  notify(event: TEvent) {
    this.observers.forEach((observer) => observer(event));
  }
}
