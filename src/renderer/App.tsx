import 'react-loading-skeleton/dist/skeleton.css';
import '../styles/animations.css';
import '../styles/components.css';
import '../styles/style.css';

import { useCallback, useEffect, useState } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { Route, Routes, useLocation } from 'react-router-dom';

import { ipcRenderer } from 'electron';
import {
  getMostPopularAnime,
  getNextReleases,
  getTrendingAnime,
  getViewerId,
  getViewerInfo,
  getViewerList
} from '../modules/anilist/anilistApi';
import { animeDataToListAnimeData } from '../modules/utils';
import { ListAnimeData, UserInfo } from '../types/anilistAPITypes';
import MainNavbar from './MainNavbar';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/Tab3';
import Tab4 from './tabs/Tab4';

import { OS } from '../modules/os';
import WindowControls from './WindowControls';
import AutoUpdateModal from './components/modals/AutoUpdateModal';
import { useStorageContext } from './contexts/storage';
import { useUIContext } from './contexts/ui';

ipcRenderer.on('console-log', (_event, toPrint) => {
  console.log(toPrint);
});

export default function App() {
  const { pathname } = useLocation();
  const { logged, accessToken } = useStorageContext();
  const { viewerId, setViewerId, hasListUpdated, setHasListUpdated } =
    useUIContext();
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // tab1
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [animeLoaded, setAnimeLoaded] = useState<boolean>(false);
  const [currentListAnime, setCurrentListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [trendingAnime, setTrendingAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [mostPopularAnime, setMostPopularAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [nextReleasesAnime, setNextReleasesAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);

  // tab2
  const [planningListAnime, setPlanningListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [completedListAnime, setCompletedListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [droppedListAnime, setDroppedListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [pausedListAnime, setPausedListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [repeatingListAnime, setRepeatingListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);

  const style = getComputedStyle(document.body);

  const fetchTab1AnimeData = useCallback(
    async (loggedIn: boolean) => {
      try {
        let id = null;
        if (loggedIn) {
          id = await getViewerId(accessToken);
          setViewerId(id);

          const info = await getViewerInfo(accessToken, id);
          setUserInfo(info);
          const current = await getViewerList(accessToken, id, 'CURRENT');
          const rewatching = await getViewerList(accessToken, id, 'REPEATING');
          setCurrentListAnime(current.concat(rewatching));
        }

        if (!animeLoaded) {
          setTrendingAnime(
            animeDataToListAnimeData(await getTrendingAnime(accessToken, id))
          );
          setMostPopularAnime(
            animeDataToListAnimeData(await getMostPopularAnime(accessToken, id))
          );
          setNextReleasesAnime(
            animeDataToListAnimeData(await getNextReleases(accessToken, id))
          );
          setAnimeLoaded(true);
        }
      } catch (error) {
        console.log(`Tab1 error: ${error}`);
      }
    },
    [accessToken, animeLoaded, setViewerId]
  );

  const fetchTab2AnimeData = useCallback(async () => {
    try {
      if (viewerId) {
        setPlanningListAnimeListAnime(
          await getViewerList(accessToken, viewerId, 'PLANNING')
        );
        setCompletedListAnimeListAnime(
          await getViewerList(accessToken, viewerId, 'COMPLETED')
        );
        setDroppedListAnimeListAnime(
          await getViewerList(accessToken, viewerId, 'DROPPED')
        );
        setPausedListAnimeListAnime(
          await getViewerList(accessToken, viewerId, 'PAUSED')
        );
        setRepeatingListAnimeListAnime(
          await getViewerList(accessToken, viewerId, 'REPEATING')
        );
      }
    } catch (error) {
      console.log(`Tab2 error: ${error}`);
    }
  }, [accessToken, viewerId]);

  useEffect(() => {
    if (pathname === '/') {
      void fetchTab1AnimeData(logged);
    }
  }, [fetchTab1AnimeData, logged, pathname]);

  useEffect(() => {
    if (pathname === '/tab2') {
      void fetchTab2AnimeData();
    }
  }, [fetchTab2AnimeData, pathname]);

  useEffect(() => {
    if (hasListUpdated) {
      void fetchTab1AnimeData(logged);
      void fetchTab2AnimeData();
      setHasListUpdated(false);
    }
  }, [
    fetchTab1AnimeData,
    fetchTab2AnimeData,
    hasListUpdated,
    logged,
    pathname,
    setHasListUpdated
  ]);

  useEffect(() => {
    ipcRenderer.on('auto-update', () => {
      setShowUpdateModal(true);
    });

    return () => {
      ipcRenderer.removeListener('auto-update', () => {
        setShowUpdateModal(true);
      });
    };
  }, []);

  return (
    <SkeletonTheme
      baseColor={style.getPropertyValue('--color-3')}
      highlightColor={style.getPropertyValue('--color-4')}
    >
      <AutoUpdateModal
        show={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
        }}
      />
      {!OS.isMac && <WindowControls />}
      <MainNavbar avatar={userInfo?.avatar?.medium} />
      <Routes>
        <Route
          path="/"
          element={
            <Tab1
              userInfo={userInfo}
              currentListAnime={currentListAnime}
              trendingAnime={trendingAnime}
              mostPopularAnime={mostPopularAnime}
              nextReleasesAnime={nextReleasesAnime}
            />
          }
        />
        {logged && (
          <Route
            path="/tab2"
            element={
              <Tab2
                currentListAnime={currentListAnime}
                planningListAnime={planningListAnime}
                completedListAnime={completedListAnime}
                droppedListAnime={droppedListAnime}
                pausedListAnime={pausedListAnime}
                repeatingListAnime={repeatingListAnime}
              />
            }
          />
        )}
        <Route path="/tab3" element={<Tab3 />} />
        <Route path="/tab4" element={<Tab4 />} />
      </Routes>
    </SkeletonTheme>
  );
}
