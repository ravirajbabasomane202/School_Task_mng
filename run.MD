## Backend

1. Create the database:
```powershell
psql -U postgres
CREATE DATABASE taskmanager;
```

2. Install dependencies and run migrations:
```powershell
cd backend
pip install -r requirements.txt
$env:FLASK_APP = "run.py"
python -m flask db upgrade
python -m flask seed
python run.py
```

Backend runs at `http://localhost:5000`.

Demo logins after seeding:
- Chairman: `chairman@school.com` / `chairman123`
- Director: `director@school.com` / `director123`

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Optional environment variable:
- `VITE_API_URL=http://localhost:5000/api`

How to use it on another PC
1. Install PostgreSQL

Install the same (or newer) PostgreSQL version.

2. Create the database
createdb -U postgres taskmanager

or in pgAdmin:

Right-click Databases
Create → Database
Name it taskmanager
3. Restore the backup
$env:PGPASSWORD="ravi"

& "E:\databas\bin\pg_restore.exe" `
-U postgres `
-h localhost `
-p 5432 `
-d taskmanager `
-v `
"D:\Backup\taskmanager.backup"

On the new PC, replace E:\databas\bin\pg_restore.exe with the actual location of pg_restore.exe if it's different.


PS D:\Company_Data\New_Schook_task_managament\updated_project_final\project> python -V
Python 3.10.11
PS D:\Company_Data\New_Schook_task_managament\updated_project_final\project> pip list
WARNING: Ignoring invalid distribution -rotobuf (c:\users\ravir\appdata\roaming\python\python310\site-packages)
Package                                  Version
---------------------------------------- ------------
absl-py                                  2.4.0
accelerate                               1.13.0
aiohappyeyeballs                         2.6.1
aiohttp                                  3.12.15
aiosignal                                1.4.0
aiosqlite                                0.22.1
aistudio-sdk                             0.3.8
alembic                                  1.17.0
altair                                   5.5.0
amqp                                     5.3.1
annotated-doc                            0.0.4
annotated-types                          0.7.0
anthropic                                0.96.0
anyio                                    4.11.0
APScheduler                              3.10.4
arabic-reshaper                          3.0.0
arxiv                                    4.0.0
asgiref                                  3.10.0
asn1crypto                               1.5.1
ast_serialize                            0.5.0
asttokens                                3.0.1
astunparse                               1.6.3
async-generator                          1.10
async-timeout                            5.0.1
attrs                                    25.3.0
Authlib                                  1.6.9
babel                                    2.17.0
backoff                                  2.2.1
backports.asyncio.runner                 1.2.0
backports-datetime-fromisoformat         2.0.3
barcode                                  1.0.4
bce-python-sdk                           0.9.71
bcrypt                                   5.0.0
beautifulsoup4                           4.14.2
bert-score                               0.3.13
bidict                                   0.23.1
billiard                                 4.2.4
bitsandbytes                             0.49.2
black                                    26.5.1
bleach                                   6.3.0
blinker                                  1.9.0
blis                                     1.3.3
boto3                                    1.43.25
botocore                                 1.43.25
breadability                             0.1.20
brotli                                   1.2.0
build                                    1.3.0
cachetools                               6.2.1
catalogue                                2.0.10
celery                                   5.6.2
certifi                                  2026.1.4
cffi                                     2.0.0
chardet                                  7.4.2
charset-normalizer                       3.4.7
chroma-hnswlib                           0.7.3
chromadb                                 1.5.0
clean-text                               0.7.1
click                                    8.3.0
click-didyoumean                         0.3.1
click-plugins                            1.1.1.2
click-repl                               0.3.0
cloudpathlib                             0.16.0
cloudpickle                              3.1.2
cobble                                   0.1.4
colorama                                 0.4.6
coloredlogs                              15.0.1
colorlog                                 6.10.1
comm                                     0.2.3
comtypes                                 1.4.14
confection                               1.3.3
contourpy                                1.3.2
crc32c                                   2.8
cryptography                             46.0.5
cssselect2                               0.9.0
cycler                                   0.12.1
cymem                                    2.0.11
dash                                     3.2.0
databricks-sdk                           0.115.0
datasets                                 4.7.0
debugpy                                  1.8.16
decorator                                5.2.1
Deprecated                               1.2.18
dill                                     0.4.0
distro                                   1.9.0
dnspython                                2.8.0
docker                                   7.1.0
docopt                                   0.6.2
docopt-ng                                0.9.0
docstring_parser                         0.17.0
durationpy                               0.10
ecdsa                                    0.19.1
email-validator                          2.3.0
emoji                                    2.15.0
en-core-web-sm                           3.7.1
et_xmlfile                               2.0.0
eventlet                                 0.36.1
exceptiongroup                           1.3.0
executing                                2.2.1
fastapi                                  0.119.0
feedparser                               6.0.12
filelock                                 3.19.1
fire                                     0.7.1
Flask                                    3.1.2
flask-babel                              4.0.0
Flask-Bcrypt                             1.0.1
Flask-Cors                               4.0.0
Flask-JWT-Extended                       4.5.3
Flask-Limiter                            4.1.1
Flask-Login                              0.6.3
Flask-Mail                               0.9.1
Flask-Migrate                            4.0.5
Flask-PyMongo                            3.0.1
flask-redis                              0.4.0
Flask-SocketIO                           5.3.6
Flask-SQLAlchemy                         3.0.5
Flask-WTF                                1.2.1
flatbuffers                              25.9.23
fonttools                                4.60.1
freetype-py                              2.5.1
frozenlist                               1.8.0
fsspec                                   2025.9.0
ftfy                                     6.3.1
future                                   1.0.0
gast                                     0.7.0
geographiclib                            2.1
geojson                                  3.2.0
geopandas                                1.1.1
geopy                                    2.4.1
gitdb                                    4.0.12
GitPython                                3.1.45
google-auth                              2.41.1
google-pasta                             0.2.0
googleapis-common-protos                 1.70.0
graphene                                 3.4.3
graphql-core                             3.2.11
graphql-relay                            3.2.0
graphviz                                 0.21
greenlet                                 3.2.4
grpcio                                   1.75.1
gunicorn                                 25.1.0
h11                                      0.16.0
h5py                                     3.14.0
hf-xet                                   1.4.0
html5lib                                 1.1
httpcore                                 1.0.9
httptools                                0.7.1
httpx                                    0.28.1
huey                                     3.0.1
huggingface_hub                          1.6.0
humanfriendly                            10.0
idna                                     3.10
imagesize                                2.0.0
imbalanced-learn                         0.14.0
imblearn                                 0.0
img2table                                2.0.0
importlib-metadata                       6.11.0
importlib_resources                      6.5.2
iniconfig                                2.1.0
ipykernel                                7.2.0
ipython                                  8.39.0
isort                                    8.0.1
itsdangerous                             2.2.0
jedi                                     0.19.2
Jinja2                                   3.1.6
jiter                                    0.14.0
jmespath                                 1.1.0
joblib                                   1.5.2
jsonlines                                4.0.0
jsonschema                               4.25.1
jsonschema-specifications                2025.9.1
jupyter_client                           8.8.0
jupyter_core                             5.8.1
keras                                    3.12.1
kiwisolver                               1.4.9
kombu                                    5.6.2
kubernetes                               34.1.0
langcodes                                3.5.0
language_data                            1.3.0
Levenshtein                              0.27.3
libclang                                 18.1.1
librt                                    0.11.0
limits                                   5.8.0
loguru                                   0.7.3
lxml                                     6.1.1
lxml_html_clean                          0.4.4
Mako                                     1.3.10
mammoth                                  1.11.0
marisa-trie                              1.3.1
markdown-it-py                           4.0.0
MarkupSafe                               3.0.3
marshmallow                              4.2.0
marshmallow-enum                         1.5.1
marshmallow-sqlalchemy                   1.5.0
matplotlib                               3.10.7
matplotlib-inline                        0.2.1
mdurl                                    0.1.2
ml_dtypes                                0.5.4
mlflow                                   3.13.0
mlflow-skinny                            3.13.0
mlflow-tracing                           3.13.0
mmh3                                     5.2.0
modelscope                               1.37.1
MouseInfo                                0.1.3
mpmath                                   1.3.0
multidict                                6.6.4
multiprocess                             0.70.18
murmurhash                               1.0.13
mypy                                     2.1.0
mypy_extensions                          1.1.0
namex                                    0.1.0
narwhals                                 2.7.0
natsort                                  8.4.0
nest-asyncio                             1.6.0
networkx                                 3.4.2
nltk                                     3.9.2
numpy                                    2.2.6
nvidia-ml-py                             13.590.48
oauthlib                                 3.3.1
ollama                                   0.6.1
onnxruntime                              1.23.1
openai                                   1.12.0
opencv-contrib-python                    4.10.0.84
opencv-python                            4.13.0.92
openpyxl                                 3.1.5
opentelemetry-api                        1.21.0
opentelemetry-exporter-otlp-proto-common 1.21.0
opentelemetry-exporter-otlp-proto-grpc   1.21.0
opentelemetry-exporter-otlp-proto-http   1.21.0
opentelemetry-instrumentation            0.42b0
opentelemetry-instrumentation-asgi       0.42b0
opentelemetry-instrumentation-fastapi    0.42b0
opentelemetry-proto                      1.21.0
opentelemetry-sdk                        1.21.0
opentelemetry-semantic-conventions       0.42b0
opentelemetry-util-http                  0.42b0
opt-einsum                               3.3.0
optree                                   0.19.0
ordered-set                              4.1.0
orjson                                   3.11.3
oscrypto                                 1.3.0
osmnx                                    2.0.6
OSMPythonTools                           0.3.6
outcome                                  1.3.0.post0
overrides                                7.7.0
packaging                                25.0
paddleocr                                3.6.0
paddlepaddle                             3.3.1
paddlex                                  3.6.1
pandas                                   2.3.3
parso                                    0.8.6
passlib                                  1.7.4
pathspec                                 1.1.1
patsy                                    1.0.2
pdf2image                                1.17.0
pdfminer.six                             20251230
pdfplumber                               0.11.9
peft                                     0.18.1
pillow                                   11.3.0
pip                                      26.0.1
platformdirs                             4.5.1
playwright                               1.57.0
plotly                                   6.3.1
pluggy                                   1.6.0
portalocker                              3.2.0
posthog                                  5.4.0
preshed                                  3.0.10
prettytable                              3.17.0
prompt_toolkit                           3.0.52
propcache                                0.4.0
protobuf                                 4.25.9
psutil                                   7.1.0
psycopg2-binary                          2.9.11
pulsar-client                            3.8.0
pure_eval                                0.2.3
py-cpuinfo                               9.0.0
pyarrow                                  21.0.0
pyasn1                                   0.6.1
pyasn1_modules                           0.4.2
PyAutoGUI                                0.9.54
pybase64                                 1.4.3
pycairo                                  1.29.0
pyclipper                                1.4.0
pycountry                                26.2.16
pycparser                                2.23
pycryptodome                             3.23.0
pydantic                                 2.11.10
pydantic_core                            2.33.2
pydantic-settings                        2.13.0
pydeck                                   0.9.1
pydyf                                    0.12.1
pyee                                     13.0.0
PyGetWindow                              0.0.9
Pygments                                 2.19.2
pygraphviz                               1.14
pyHanko                                  0.33.0
pyhanko-certvalidator                    0.29.1
PyJWT                                    2.8.0
pymongo                                  4.10.0
PyMsgBox                                 2.0.1
PyMuPDF                                  1.27.2.3
pyogrio                                  0.11.1
pyparsing                                3.2.5
pypdf                                    6.6.0
pypdfium2                                5.8.0
pyperclip                                1.11.0
pyphen                                   0.17.2
PyPika                                   0.48.9
pypiwin32                                223
pyproj                                   3.7.1
pyproject_hooks                          1.2.0
pyreadline3                              3.5.4
PyRect                                   0.2.0
PyScreeze                                1.0.1
PySocks                                  1.7.1
pytesseract                              0.3.13
pytest                                   9.0.3
pytest-asyncio                           1.4.0
python-barcode                           0.16.1
python-bidi                              0.6.7
python-dateutil                          2.9.0.post0
python-docx                              1.2.0
python-dotenv                            1.2.2
python-engineio                          4.12.3
python-jose                              3.5.0
python-Levenshtein                       0.27.3
python-multipart                         0.0.21
python-pptx                              1.0.2
python-socketio                          5.14.1
pytokens                                 0.4.1
pyttsx3                                  2.99
pytweening                               1.2.0
pytz                                     2025.2
pywin32                                  311
PyYAML                                   6.0.2
pyzmq                                    27.0.1
qrcode                                   8.2
RapidFuzz                                3.14.3
razorpay                                 1.4.1
redis                                    6.4.0
referencing                              0.36.2
regex                                    2025.9.18
reportlab                                4.4.10
requests                                 2.33.1
requests-oauthlib                        2.0.0
retrying                                 1.4.2
rich                                     14.2.0
rlPyCairo                                0.4.0
rouge_score                              0.1.2
rpds-py                                  0.27.1
rsa                                      4.9.1
ruamel.yaml                              0.19.1
s3transfer                               0.18.0
sacrebleu                                2.6.0
safetensors                              0.6.2
scikit-learn                             1.5.2
scipy                                    1.15.3
seaborn                                  0.13.2
selenium                                 4.40.0
sentence-transformers                    5.2.2
sentencepiece                            0.2.1
sentry-sdk                               2.51.0
setuptools                               65.5.0
sgmllib3k                                1.0.0
shapely                                  2.1.2
shellingham                              1.5.4
simple-websocket                         1.1.0
six                                      1.17.0
skops                                    0.14.0
slowapi                                  0.1.9
smart-open                               6.4.0
smmap                                    5.0.2
sniffio                                  1.3.1
sortedcontainers                         2.4.0
sounddevice                              0.5.3
soupsieve                                2.8
spacy                                    3.8.14
spacy-legacy                             3.0.12
spacy-loggers                            1.0.5
SQLAlchemy                               2.0.43
sqlparse                                 0.5.5
srsly                                    2.5.3
srt                                      3.5.3
sse-starlette                            3.0.3
stack-data                               0.6.3
starlette                                0.48.0
statsmodels                              0.14.5
streamlit                                1.50.0
streamlit-ace                            0.1.1
streamlit-option-menu                    0.4.0
sumy                                     0.12.0
svglib                                   1.6.0
sympy                                    1.13.1
tabulate                                 0.10.0
TadetextSummarizer                       0.1.4
tenacity                                 9.1.2
tensorflow                               2.21.0
termcolor                                3.3.0
textstat                                 0.7.13
textsum                                  0.2.2
thinc                                    8.3.13
threadpoolctl                            3.6.0
timm                                     1.0.26
tinycss2                                 1.5.1
tinyhtml5                                2.0.0
tokenizers                               0.22.2
toml                                     0.10.2
tomli                                    2.2.1
torch                                    2.5.1+cu121
torchaudio                               2.5.1+cu121
torchvision                              0.20.1+cu121
tornado                                  6.5.2
tqdm                                     4.67.1
traitlets                                5.14.3
transformers                             5.3.0
trio                                     0.32.0
trio-typing                              0.10.0
trio-websocket                           0.12.2
trl                                      0.29.0
typeguard                                4.5.1
typer                                    0.26.7
typer-slim                               0.20.0
types-certifi                            2021.10.8.3
types-urllib3                            1.26.25.14
typing_extensions                        4.15.0
typing-inspection                        0.4.2
tyro                                     1.0.8
tzdata                                   2025.2
tzlocal                                  5.3.1
ujson                                    5.11.0
Unidecode                                1.4.0
uritools                                 6.0.1
urllib3                                  2.6.3
uv                                       0.9.3
uvicorn                                  0.37.0
vine                                     5.1.0
vosk                                     0.3.45
waitress                                 3.0.2
wandb                                    0.24.1
wasabi                                   1.1.3
watchdog                                 6.0.0
watchfiles                               1.1.1
wcwidth                                  0.6.0
weasel                                   1.0.0
weasyprint                               68.1
webdriver-manager                        4.0.2
webencodings                             0.5.1
webrtcvad                                2.0.10
websocket-client                         1.9.0
websockets                               15.0.1
Werkzeug                                 3.1.5
wheel                                    0.46.3
win32_setctime                           1.2.0
wrapt                                    1.17.3
wsproto                                  1.2.0
WTForms                                  3.2.1
xarray                                   2025.6.1
xgboost                                  3.1.2
xhtml2pdf                                0.2.17
xlsxwriter                               3.2.9
xxhash                                   3.6.0
yarl                                     1.21.0
zipp                                     3.23.0
zopfli                                   0.4.1
PS D:\Company_Data\New_Schook_task_managament\updated_project_final\project> 


PS D:\Company_Data\New_Schook_task_managament\updated_project_final\project> npm
npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
npm -l             display usage info for all commands
npm help <term>    search for help on <term> (in a browser)
npm help npm       more involved overview (in a browser)

All commands:

    access, adduser, audit, bugs, cache, ci, completion,
    config, dedupe, deprecate, diff, dist-tag, docs, doctor,
    edit, exec, explain, explore, find-dupes, fund, get, help,
    help-search, init, install, install-ci-test, install-test,
    link, ll, login, logout, ls, org, outdated, owner, pack,
    ping, pkg, prefix, profile, prune, publish, query, rebuild,
    repo, restart, root, run, sbom, search, set, shrinkwrap,
    star, stars, start, stop, team, test, token, undeprecate,
    uninstall, unpublish, unstar, update, version, view, whoami

Specify configs in the ini-formatted file:
    C:\Users\ravir\.npmrc
or on the command line via: npm <command> --key=value

More configuration info: npm help config
Configuration fields: npm help 7 config

npm@11.5.2 C:\Users\ravir\AppData\Roaming\npm\node_modules\npm
PS D:\Company_Data\New_Schook_task_managament\updated_project_final\project> 