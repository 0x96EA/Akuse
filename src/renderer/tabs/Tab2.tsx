import { ListAnimeData } from '../../types/anilistAPITypes';
import AnimeSection from '../components/AnimeSection';
import Heading from '../components/Heading';

interface Tab2Props {
  currentListAnime?: ListAnimeData[];
  planningListAnime?: ListAnimeData[];
  completedListAnime?: ListAnimeData[];
  droppedListAnime?: ListAnimeData[];
  pausedListAnime?: ListAnimeData[];
  repeatingListAnime?: ListAnimeData[];
}

const Tab2 = ({
  currentListAnime,
  planningListAnime,
  completedListAnime,
  droppedListAnime,
  pausedListAnime,
  repeatingListAnime
}: Tab2Props) => {
  return (
    <div className="body-container show-tab">
      <div className="main-container">
        <main>
          <Heading text="Library" />
          <div className="section-container">
            <AnimeSection
              title="Continue Watching"
              animeData={currentListAnime}
            />
            <AnimeSection title="Your List" animeData={planningListAnime} />
            <AnimeSection title="Completed" animeData={completedListAnime} />
            <AnimeSection title="Dropped" animeData={droppedListAnime} />
            <AnimeSection title="Paused" animeData={pausedListAnime} />
            <AnimeSection title="Repeating" animeData={repeatingListAnime} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tab2;
