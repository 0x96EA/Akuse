import { useCallback, useEffect, useState } from 'react';
import { STORAGE } from '../../modules/storage';
import {
  LanguageOptions,
  STORE_SCHEMA,
  StorageContextType,
  StoreKeys
} from '../../modules/storeVariables';

export const useStorage = (): StorageContextType => {
  const [logged, setLogged] = useState<boolean>(STORE_SCHEMA.logged.default);
  const [accessToken, setAccessToken] = useState<string>(
    STORE_SCHEMA.access_token.default
  );
  const [updateProgress, setUpdateProgress] = useState<boolean>(
    STORE_SCHEMA.update_progress
  );
  const [watchDubbed, setWatchDubbed] = useState<boolean>(
    STORE_SCHEMA.dubbed.default
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOptions>(
    STORE_SCHEMA.source_flag.default
  );
  const [skipTime, setSkipTime] = useState<number>(
    STORE_SCHEMA.intro_skip_time.default
  );
  const [showDuration, setShowDuration] = useState<boolean>(
    STORE_SCHEMA.show_duration.default
  );
  const [trailerVolumeOn, setTrailerVolumeOn] = useState<boolean>(
    STORE_SCHEMA.trailer_volume_on.default
  );

  const loadStorage = useCallback(async () => {
    const store = await STORAGE.getStore();
    if (store.logged !== logged) {
      if (store.logged === undefined) {
        await STORAGE.set('logged', STORE_SCHEMA.logged.default);
      }
      setLogged(store.logged ?? STORE_SCHEMA.logged.default);
    }

    if (store.access_token !== accessToken) {
      if (store.access_token === undefined) {
        await STORAGE.set('access_token', STORE_SCHEMA.access_token.default);
      }
      setAccessToken(store.access_token ?? STORE_SCHEMA.access_token.default);
    }

    if (store.update_progress !== updateProgress) {
      if (store.update_progress === undefined) {
        await STORAGE.set(
          'update_progress',
          STORE_SCHEMA.update_progress.default
        );
      }
      setUpdateProgress(
        store.update_progress ?? STORE_SCHEMA.update_progress.default
      );
    }

    if (store.dubbed !== watchDubbed) {
      if (store.dubbed === undefined) {
        await STORAGE.set('dubbed', STORE_SCHEMA.dubbed.default);
      }
      setWatchDubbed(store.dubbed ?? STORE_SCHEMA.dubbed.default);
    }

    if (store.source_flag !== selectedLanguage) {
      if (store.source_flag === undefined) {
        await STORAGE.set('source_flag', STORE_SCHEMA.source_flag.default);
      }
      setSelectedLanguage(
        store.source_flag ?? STORE_SCHEMA.source_flag.default
      );
    }

    if (store.intro_skip_time !== skipTime) {
      if (store.intro_skip_time === undefined) {
        await STORAGE.set(
          'intro_skip_time',
          STORE_SCHEMA.intro_skip_time.default
        );
      }
      setSkipTime(
        store.intro_skip_time ?? STORE_SCHEMA.intro_skip_time.default
      );
    }

    if (store.show_duration !== showDuration) {
      if (store.show_duration === undefined) {
        await STORAGE.set('show_duration', STORE_SCHEMA.show_duration.default);
      }
      setShowDuration(
        store.show_duration ?? STORE_SCHEMA.show_duration.default
      );
    }

    if (store.trailer_volume_on !== trailerVolumeOn) {
      if (store.trailer_volume_on === undefined) {
        await STORAGE.set(
          'trailer_volume_on',
          STORE_SCHEMA.trailer_volume_on.default
        );
      }
      setTrailerVolumeOn(
        store.trailer_volume_on ?? STORE_SCHEMA.trailer_volume_on.default
      );
    }

    console.log('store - loaded');
  }, [
    accessToken,
    logged,
    selectedLanguage,
    showDuration,
    skipTime,
    trailerVolumeOn,
    updateProgress,
    watchDubbed
  ]);

  const updateStorage = useCallback(async (key: StoreKeys, value: any) => {
    let newValue = null;
    switch (key) {
      case 'logged':
        newValue = await STORAGE.getLogged();
        setLogged(value);
        break;
      case 'access_token':
        newValue = await STORAGE.getAccessToken();
        setAccessToken(value);
        break;
      case 'update_progress':
        newValue = await STORAGE.getUpdateProgress();
        setUpdateProgress(value);
        break;
      case 'dubbed':
        newValue = await STORAGE.getDubbed();
        setWatchDubbed(value);
        break;
      case 'source_flag':
        newValue = await STORAGE.getSourceFlag();
        setSelectedLanguage(value);
        break;
      case 'intro_skip_time':
        newValue = await STORAGE.getIntroSkipTime();
        setSkipTime(value);
        break;
      case 'show_duration':
        newValue = await STORAGE.getShowDuration();
        setShowDuration(value);
        break;
      case 'trailer_volume_on':
        newValue = await STORAGE.getTrailerVolumeOn();
        setTrailerVolumeOn(value);
        break;
      default:
    }

    await STORAGE.set(key, value);
    console.log(
      `store - ${key} updated to ${value} ${newValue !== value ? `(was ${newValue})` : ''}`
    );
  }, []);

  useEffect(() => {
    loadStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    logged,
    accessToken,
    updateProgress,
    watchDubbed,
    selectedLanguage,
    skipTime,
    showDuration,
    trailerVolumeOn,
    updateStorage
  };
};
