// このデモで使用する kintone JavaScript API の最小限の型定義。
declare const kintone: {
  $PLUGIN_ID: string;
  plugin: {
    app: {
      getConfig(pluginId: string): Record<string, string>;
      setConfig(config: Record<string, string>, callback: () => void): void;
    };
  };
  events: {
    on(event: string, handler: (event: unknown) => unknown): void;
  };
  app: {
    getId(): number | null;
    record: {
      getHeaderMenuSpaceElement(): HTMLElement | null;
    };
  };
};
