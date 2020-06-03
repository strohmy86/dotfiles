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

