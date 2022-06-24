# Path to Oh My Fish install.
set -q XDG_DATA_HOME
  and set -gx OMF_PATH "$XDG_DATA_HOME/omf"
  or set -gx OMF_PATH "$HOME/.local/share/omf"

# Load Oh My Fish configuration.
source $OMF_PATH/init.fish
set pure_color_success brcyan
set pure_color_current_directory brblue
set pure_color_primary green
set pure_color_info brcyan
set pure_color_mute brgreen
thefuck --alias | source
export SHELL="/bin/fish"
source ~/.zsh/aliases.zsh
if [ $TERM != "dumb" ]
    export LS_OPTIONS='--color=auto'
end
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export MSF_DATABASE_CONFIG="`ls ~/.msf4/database.yml`"
export PATH="/home/lstrohm/.local/bin:/var/lib/snapd/snap/bin:/usr/sbin:/usr/local/opt/qt/bin:$PATH"
export GAM_THREADS=15
#export DOCKER_HOST=tcp://guac.mlsd.net:2376 DOCKER_TLS_VERIFY=1

## Bang Bang function
function __history_previous_command
  switch (commandline -t)
  case "!"
    commandline -t $history[1]; commandline -f repaint
  case "*"
    commandline -i !
  end
end

function __history_previous_command_arguments
  switch (commandline -t)
  case "!"
    commandline -t ""
    commandline -f history-token-search-backward
  case "*"
    commandline -i '$'
  end
end

bind ! __history_previous_command
bind '$' __history_previous_command_arguments
