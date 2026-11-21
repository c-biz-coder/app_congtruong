export interface Dictionary {
  appName: string;
  nav: {
    projects: string;
    workers: string;
    attendance: string;
    safety: string;
    incidents: string;
    reports: string;
  };
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    submit: string;
    approve: string;
    reject: string;
  };
  common: {
    loading: string;
    empty: string;
    error: string;
    retry: string;
    offline: string;
  };
}
