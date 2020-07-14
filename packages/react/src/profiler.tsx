import { getCurrentHub, Hub } from '@sentry/browser';
import { Span, Transaction } from '@sentry/types';
import { timestampWithMs } from '@sentry/utils';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as React from 'react';

export const UNKNOWN_COMPONENT = 'unknown';

export type ProfilerProps = {
  // The name of the component being profiled.
  name: string;
  // If the Profiler is disabled. False by default. This is useful if you want to disable profilers
  // in certain environments.
  disabled?: boolean;
  // If time component is on page should be displayed as spans. True by default.
  includeRender?: boolean;
  // If component updates should be displayed as spans. True by default.
  includeUpdates?: boolean;
  // props given to component being profiled.
  updateProps: { [key: string]: any };
};

/**
 * The Profiler component leverages Sentry's Tracing integration to generate
 * spans based on component lifecycles.
 */
class Profiler extends React.Component<ProfilerProps> {
  // The span representing how long it takes to mount a component
  public mountSpan: Span | undefined = undefined;

  public static defaultProps: Partial<ProfilerProps> = {
    disabled: false,
    includeRender: true,
    includeUpdates: true,
  };

  public constructor(props: ProfilerProps) {
    super(props);
    const { name, disabled = false } = this.props;

    if (disabled) {
      return;
    }

    const activeTransaction = getActiveTransaction();
    if (activeTransaction) {
      this.mountSpan = activeTransaction.startChild({
        description: `<${name}>`,
        op: 'react.mount',
      });
    }
  }

  // If a component mounted, we can finish the mount activity.
  public componentDidMount(): void {
    if (this.mountSpan) {
      this.mountSpan.finish();
    }
  }

  public componentDidUpdate({ updateProps, includeUpdates = true }: ProfilerProps): void {
    // Only generate an update span if hasUpdateSpan is true, if there is a valid mountSpan,
    // and if the updateProps have changed. It is ok to not do a deep equality check here as it is expensive.
    // We are just trying to give baseline clues for further investigation.
    if (includeUpdates && this.mountSpan && updateProps !== this.props.updateProps) {
      // See what props haved changed between the previous props, and the current props. This is
      // set as data on the span. We just store the prop keys as the values could be potenially very large.
      const changedProps = Object.keys(updateProps).filter(k => updateProps[k] !== this.props.updateProps[k]);
      if (changedProps.length > 0) {
        // The update span is a point in time span with 0 duration, just signifying that the component
        // has been updated.
        const now = timestampWithMs();
        this.mountSpan.startChild({
          data: {
            changedProps,
          },
          description: `<${this.props.name}>`,
          endTimestamp: now,
          op: `react.update`,
          startTimestamp: now,
        });
      }
    }
  }

  // If a component is unmounted, we can say it is no longer on the screen.
  // This means we can finish the span representing the component render.
  public componentWillUnmount(): void {
    const { name, includeRender = true } = this.props;

    if (this.mountSpan && includeRender) {
      // If we were able to obtain the spanId of the mount activity, we should set the
      // next activity as a child to the component mount activity.
      this.mountSpan.startChild({
        description: `<${name}>`,
        endTimestamp: timestampWithMs(),
        op: `react.render`,
        startTimestamp: this.mountSpan.endTimestamp,
      });
    }
  }

  public render(): React.ReactNode {
    return this.props.children;
  }
}

/**
 * withProfiler is a higher order component that wraps a
 * component in a {@link Profiler} component. It is recommended that
 * the higher order component be used over the regular {@link Profiler} component.
 *
 * @param WrappedComponent component that is wrapped by Profiler
 * @param options the {@link ProfilerProps} you can pass into the Profiler
 */
function withProfiler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  // We do not want to have `updateProps` given in options, it is instead filled through the HOC.
  options?: Pick<Partial<ProfilerProps>, Exclude<keyof ProfilerProps, 'updateProps'>>,
): React.FC<P> {
  const componentDisplayName =
    (options && options.name) || WrappedComponent.displayName || WrappedComponent.name || UNKNOWN_COMPONENT;

  const Wrapped: React.FC<P> = (props: P) => (
    <Profiler {...options} name={componentDisplayName} updateProps={props}>
      <WrappedComponent {...props} />
    </Profiler>
  );

  Wrapped.displayName = `profiler(${componentDisplayName})`;

  // Copy over static methods from Wrapped component to Profiler HOC
  // See: https://reactjs.org/docs/higher-order-components.html#static-methods-must-be-copied-over
  hoistNonReactStatic(Wrapped, WrappedComponent);
  return Wrapped;
}

/**
 *
 * `useProfiler` is a React hook that profiles a React component.
 *
 * Requires React 16.8 or above.
 * @param name displayName of component being profiled
 */
function useProfiler(
  name: string,
  options: { disabled?: boolean; hasRenderSpan?: boolean } = {
    disabled: false,
    hasRenderSpan: true,
  },
): void {
  const [mountSpan] = React.useState(() => {
    if (options && options.disabled) {
      return undefined;
    }

    const activeTransaction = getActiveTransaction();
    if (activeTransaction) {
      return activeTransaction.startChild({
        description: `<${name}>`,
        op: 'react.mount',
      });
    }

    return undefined;
  });

  React.useEffect(() => {
    if (mountSpan) {
      mountSpan.finish();
    }

    return () => {
      if (mountSpan && options.hasRenderSpan) {
        mountSpan.startChild({
          description: `<${name}>`,
          endTimestamp: timestampWithMs(),
          op: `react.render`,
          startTimestamp: mountSpan.endTimestamp,
        });
      }
    };
  }, []);
}

export { withProfiler, Profiler, useProfiler };

/** Grabs active transaction off scope */
export function getActiveTransaction<T extends Transaction>(hub: Hub = getCurrentHub()): T | undefined {
  if (hub) {
    const scope = hub.getScope();
    if (scope) {
      return scope.getTransaction() as T | undefined;
    }
  }

  return undefined;
}
