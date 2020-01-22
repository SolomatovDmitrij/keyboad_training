{-# LANGUAGE DeriveDataTypeable         #-}
{-# LANGUAGE FlexibleContexts           #-}
{-# LANGUAGE GADTs                      #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses      #-}
{-# LANGUAGE OverloadedStrings          #-}
{-# LANGUAGE QuasiQuotes                #-}
{-# LANGUAGE TemplateHaskell            #-}
{-# LANGUAGE TypeFamilies               #-}
{-# LANGUAGE RecordWildCards            #-}
{-# LANGUAGE DeriveGeneric              #-}

import Yesod
import Yesod.Static
import Database.Persist
import Database.Persist.TH
import Database.Persist.Postgresql
import Control.Monad.Trans.Resource (runResourceT)
import Control.Monad.Logger (runStderrLoggingT)
import Data.Aeson  
import Data.Aeson.Types
import Data.Text.Read (decimal)
import Data.Text.Internal (Text, showText)
import Data.ByteString.Lazy (fromStrict)
import qualified Data.Text as T 
import Data.Text.Encoding (encodeUtf8)
import Data.Time
import GHC.Generics
import Data.Char
import qualified Database.Esqueleto      as E
import           Database.Esqueleto      ((^.))

staticFiles "static"

share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Books
    paragraph String
	typed     Bool
    deriving Show 
Results
    textId      BooksId
    time2       Double 
    error_count Int
    created UTCTime Maybe default=now()
    deriving Generic Show
|]

connStr = "host=192.168.0.210 dbname=visits user=postgres password=111 port=5433"

data Visits = Visits
  {getStatic :: Static,
  getConnection :: ConnectionPool}

mkYesod "Visits" [parseRoutes|
/ HomeR GET
/text TextR GET
/result ResultR POST
/load_result LoadResultR GET
/static StaticR Static getStatic
/load_text LoadR POST
/chart ChartR GET
|]

instance Yesod Visits where
    defaultLayout contents = do
        PageContent title headTags bodyTags <- widgetToPageContent contents
        withUrlRenderer [hamlet|
            $doctype 5
            <html>
                <head>
                    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js">
                    <script src=@{StaticR draw_js}>
                    <script src=@{StaticR chart_js}>
                    <link rel="stylesheet" href=@{StaticR default_css}>
                    <title>#{title}
                    ^{headTags}
                <body onload="drawLogo();">
                    <ul .navbar>
                       <li><canvas id="canvas"></li>
                       <li><a href=@{ChartR}>График</a></li>
                    <p #break_line1 .orange_style> Автодор
                    ^{bodyTags}
        |]
instance YesodPersist Visits where
    type YesodPersistBackend Visits = SqlBackend
    runDB action = do
        Visits _ pool <- getYesod
        runSqlPool action pool
data Book = Book 
    { main_text :: String,
      id        :: Key Books
    }
data Results_with_length = Results_with_length
    { results :: Results
    , length_results :: Int }

instance ToJSON Results_with_length where
    toJSON (Results_with_length r l) = object
        [ "results" .= r
        , "length"  .= l
        ]

instance ToJSON Book where
    toJSON Book {..} = object
        [ "main_text" .= main_text
        , "id"        .= id
        ]       

instance ToJSON Results where
    toEncoding = genericToEncoding defaultOptions

instance FromJSON Results where
    parseJSON = genericParseJSON defaultOptions
        { omitNothingFields = True } 

getLoadResultR :: Handler Value
getLoadResultR = do
    all_results <- runDB $ E.select $
                             E.from $ \(res `E.InnerJoin` text) -> do
                             E.on (res ^. ResultsTextId E.==. text ^. BooksId)
                             E.orderBy [E.asc (res ^. ResultsCreated)]
                             return (res ^. ResultsCreated, text ^. BooksParagraph, res ^. ResultsError_count,
                                res ^. ResultsTime2)
    returnJson $ map get_cortege_results all_results

get_cortege_results :: (E.Value a, E.Value String, E.Value Int, E.Value Double) -> (a, Double, Double)
get_cortege_results (E.Value c, E.Value text, E.Value e, E.Value time) = (c, toEnum ( length text * 60 ) / time, 
    toEnum e / toEnum (length text) * 1000 )

postResultR :: Handler ()
postResultR = do
    maybe_result <- lookupPostParams "param"
    request_context <- runRequestBody 
    liftIO $ putStrLn $ show ( maybe_result)
    let either1 = (eitherDecode $ fromStrict $ encodeUtf8 $ T.concat maybe_result) :: Either String Results
    case either1 of
        Left err1 -> liftIO $ putStrLn err1
        Right (results1) -> do
            liftIO$ putStrLn $ show results1
            result2 <- runDB $ insert results1
            runDB $ update (resultsTextId results1) [BooksTyped =. True]
            time <- liftIO getCurrentTime
            runDB $ update result2 [ResultsCreated =. Just time]
postLoadR :: Handler ()
postLoadR = do
    maybe_text <- lookupPostParam "new_text"
    case maybe_text of
        Nothing -> liftIO $ putStrLn "Текст не загружен" --defaultLayout [whamlet|<p>Текст не загружен|]
        Just text1 -> do 
            liftIO $ putStrLn (show $ T.length text1)  --defaultLayout [whamlet|<p>Текст будет загружен|]
            addToBase text1

addToBase :: Text -> Handler ()            
addToBase "" = return ()
addToBase text1 = do
    let (paragraph1, tail1) = T.splitAt 1000 text1
    let paragraph2 = remove_extra_character paragraph1 
    liftIO $ putStrLn (T.unpack paragraph2)
    runDB $ insert $ Books (T.unpack paragraph2) False
    addToBase tail1

remove_extra_character = T.replace "\n" "" . T.replace "…" "..." . T.replace (T.singleton $ chr 160) " " 
    . T.replace "–" "-" . T.replace "«" "\"" . T.replace "»" "\"" . T.replace "©" "@" . T.replace "“" "\""
    . T.replace "”" "\""

getTextR :: Handler Value
getTextR = do 
    record_find <- runDB $ selectFirst [ BooksTyped ==. False] [Asc BooksId]
    case record_find of Nothing -> return ""
                        Just (Entity id_book book1) -> returnJson $ Book (booksParagraph book1) id_book

getHomeR :: Handler Html
getHomeR = defaultLayout
  [whamlet|
    <body>
      <button #btn_start0 onclick="start();">Поехали</button>
      <div #text1>
        <span #span1 .black_style></span><span id="span2" class="black_color">
  |]

--update_text :: Entity Books -> IO ()
update_text (Entity books_id book1) = do
    let new_text = T.unpack $ remove_extra_character $ T.pack $ booksParagraph book1
    update books_id [BooksParagraph =. new_text ]
    return ()        

getChartR :: Handler Html
getChartR = do
----    all_results <- runDB $ selectList [] [Asc ResultsCreated] 
    defaultLayout [whamlet|
        <div id="chart_div" height=75%>
    |]

main :: IO ()
main = runStderrLoggingT $ withPostgresqlPool connStr 10 $ \pool -> liftIO $ do
    flip runSqlPersistMPool pool $ do
        runMigration migrateAll
        all_records <- selectList [] []
        mapM_ update_text all_records
        --insert $ Books "text1" False
    static@(Static settings) <- staticDevel "static"
    warp 3002 $ Visits static pool
