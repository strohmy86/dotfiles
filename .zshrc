# Set CLICOLOR if you want Ansi Colors in iTerm2
export CLICOLOR=1

# Set colors to match iTerm2 Terminal Colors
export TERM=xterm-256color

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

autoload -U add-zsh-hook
case $TERM in
  xterm*)
    precmd () {print -Pn "\e]0;%~\a"}
    ;;
esac

prompt_pure_preexec() {
	cmd_timestamp=$EPOCHSECONDS

	# shows the current dir and executed command in the title when a process is active
	print -Pn "\e]0;"
	echo -nE "$PWD:t: $2"
	print -Pn "\a"
}

PURE_POWER_MODE='fancy'

() {
  emulate -L zsh && setopt no_unset pipe_fail

  # `$(_pp_cond x y`) evaluates to `x` in portable mode and to `y` in fancy mode.
  if [[ ${PURE_POWER_MODE:-fancy} == fancy ]]; then
    function _pp_cond() { echo -E $2 }
  else
    if [[ $PURE_POWER_MODE != portable ]]; then
      echo -En "purepower: invalid mode: ${(qq)PURE_POWER_MODE}; " >&2
      echo -E  "valid options are 'fancy' and 'portable'; falling back to 'portable'" >&2
    fi
    function _pp_cond() { echo -E $1 }
  fi

  typeset -ga POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(
      dir_writable dir vcs)

  typeset -ga POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(
      status command_execution_time background_jobs custom_rprompt context)

  local ins=$(_pp_cond '>' '❯')
  local cmd=$(_pp_cond '<' '❮')
  if (( ${PURE_POWER_USE_P10K_EXTENSIONS:-1} )); then
    local p="\${\${\${KEYMAP:-0}:#vicmd}:+${${ins//\\/\\\\}//\}/\\\}}}"
    p+="\${\${\$((!\${#\${KEYMAP:-0}:#vicmd})):#0}:+${${cmd//\\/\\\\}//\}/\\\}}}"
  else
    p=$ins
  fi
  local ok="%F{$(_pp_cond 002 159)}${p}%f"
  local err="%F{$(_pp_cond 001 196)}${p}%f"

  typeset -g POWERLEVEL9K_MODE='awesome-fontconfig'
  typeset -g POWERLEVEL9K_MULTILINE_LAST_PROMPT_PREFIX="%(?.$ok.$err) "
  typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_PREFIX=$'\n'
  typeset -g POWERLEVEL9K_PROMPT_ON_NEWLINE=true
  typeset -g POWERLEVEL9K_RPROMPT_ON_NEWLINE=false

  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_SEGMENT_SEPARATOR=
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_WHITESPACE_BETWEEN_{LEFT,RIGHT}_SEGMENTS=

  typeset -g POWERLEVEL9K_DIR_WRITABLE_FORBIDDEN_BACKGROUND=none
  typeset -g POWERLEVEL9K_DIR_WRITABLE_FORBIDDEN_VISUAL_IDENTIFIER_COLOR=003
  typeset -g POWERLEVEL9K_LOCK_ICON="\uF023"

  typeset -g POWERLEVEL9K_DIR_{ETC,HOME,HOME_SUBFOLDER,DEFAULT}_BACKGROUND=none
  typeset -g POWERLEVEL9K_DIR_{ETC,DEFAULT}_FOREGROUND=$(_pp_cond 003 209)
  typeset -g POWERLEVEL9K_DIR_{HOME,HOME_SUBFOLDER}_FOREGROUND=$(_pp_cond 004 039)
  typeset -g POWERLEVEL9K_HOME_ICON="\uF015"
  typeset -g POWERLEVEL9K_HOME_SUB_ICON="\uF07C"
  typeset -g POWERLEVEL9K_FOLDER_ICON="\uF115"
  typeset -g POWERLEVEL9K_ETC_ICON="\uF013"

  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED,LOADING}_BACKGROUND=none
  typeset -g POWERLEVEL9K_VCS_CLEAN_FOREGROUND=$(_pp_cond 002 076)
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND=$(_pp_cond 006 014)
  typeset -g POWERLEVEL9K_VCS_MODIFIED_FOREGROUND=$(_pp_cond 003 011)
  typeset -g POWERLEVEL9K_VCS_LOADING_FOREGROUND=$(_pp_cond 005 244)
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_UNTRACKEDFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_UNSTAGEDFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_MODIFIED_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_STAGEDFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_MODIFIED_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_INCOMING_CHANGESFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_CLEAN_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_OUTGOING_CHANGESFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_CLEAN_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_STASHFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_CLEAN_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_{CLEAN,UNTRACKED,MODIFIED}_ACTIONFORMAT_FOREGROUND=001
  typeset -g POWERLEVEL9K_VCS_LOADING_ACTIONFORMAT_FOREGROUND=$POWERLEVEL9K_VCS_LOADING_FOREGROUND
  typeset -g POWERLEVEL9K_VCS_GIT_ICON="\uF1D3"
  typeset -g POWERLEVEL9K_VCS_GIT_GITHUB_ICON="\uF113"
  typeset -g POWERLEVEL9K_VCS_GIT_GITLAB_ICON="\uF296"
  typeset -g POWERLEVEL9K_VCS_GIT_BITBUCKET_ICON="\uF171"
  typeset -g POWERLEVEL9K_VCS_GIT_BRANCH_ICON="\uF126"
  typeset -g POWERLEVEL9K_VCS_REMOTE_BRANCH_ICON="\u2192"
  typeset -g POWERLEVEL9K_VCS_COMMIT_ICON="\uF221"
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_ICON="\uF059"
  typeset -g POWERLEVEL9K_VCS_UNSTAGED_ICON="\uF06A"
  typeset -g POWERLEVEL9K_VCS_STAGED_ICON="\uF055"
  typeset -g POWERLEVEL9K_VCS_INCOMING_CHANGES_ICON=$(_pp_cond '<' "\uF01A")
  typeset -g POWERLEVEL9K_VCS_OUTGOING_CHANGES_ICON=$(_pp_cond '>' "\uF01B")
  typeset -g POWERLEVEL9K_VCS_STASH_ICON="\uF01C"
  typeset -g POWERLEVEL9K_VCS_TAG_ICON="\uF217"
  typeset -g POWERLEVEL9K_SHOW_CHANGESET=true
  typeset -g POWERLEVEL9K_CHANGESET_HASH_LENGTH="12"

  typeset -g POWERLEVEL9K_STATUS_OK=false
  typeset -g POWERLEVEL9K_STATUS_ERROR_BACKGROUND=none
  typeset -g POWERLEVEL9K_STATUS_ERROR_FOREGROUND=$(_pp_cond 001 009)
  typeset -g POWERLEVEL9K_CARRIAGE_RETURN_ICON=

  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD=0
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_BACKGROUND=none
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FOREGROUND=$(_pp_cond 005 101)
  typeset -g POWERLEVEL9K_EXECUTION_TIME_ICON=

  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_VERBOSE=false
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_BACKGROUND=none
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_VISUAL_IDENTIFIER_COLOR=002
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_ICON=$(_pp_cond '%%' '☰')

  typeset -g POWERLEVEL9K_CUSTOM_RPROMPT=custom_rprompt
  typeset -g POWERLEVEL9K_CUSTOM_RPROMPT_BACKGROUND=none
  typeset -g POWERLEVEL9K_CUSTOM_RPROMPT_FOREGROUND=$(_pp_cond 004 012)

  typeset -g POWERLEVEL9K_CONTEXT_{DEFAULT,ROOT,REMOTE_SUDO,REMOTE,SUDO}_BACKGROUND=none
  typeset -g POWERLEVEL9K_CONTEXT_{DEFAULT,REMOTE_SUDO,REMOTE,SUDO}_FOREGROUND=$(_pp_cond 007 244)
  typeset -g POWERLEVEL9K_CONTEXT_ROOT_FOREGROUND=$(_pp_cond 003 011)

  function custom_rprompt() {}  # redefine this to show stuff in custom_rprompt segment

  add-zsh-hook preexec prompt_pure_preexec
  unfunction _pp_cond
} "$@"

source ~/.fonts/*.sh
#source ~/.zsh/path.zsh
source ~/.zsh/aliases.zsh
#source ~/.zsh/functions.zsh
source ~/.zsh/options.zsh
source ~/.zsh/colors.zsh
source ~/.zsh/powerlevel10k/powerlevel10k.zsh-theme
#source ~/.zsh/powerlevel9k/powerlevel9k.zsh-theme
#source ~/.zsh/pure.zsh
#source ~/.zsh/agnoster.zsh
#source ~/.zsh/zkbd.zsh
source ~/.zsh/plugins/zsh-completions/zsh-completions.plugin.zsh
source ~/.zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/plugins/key-bindings.zsh
test -r @PREFIX@/bin/init.sh && . @PREFIX@/bin/init.sh

bindkey '^[[3~' delete-char
#bindkey '^[[7~' beginning-of-line
#bindkey '^[[8~' end-of-line

PATH="${PATH+:}${PATH}"; export PATH;

# zsh-bd
. ~/.zsh/plugins/bd/bd.zsh
#export MSF_DATABASE_CONFIG="`ls ~/.msf4/database.yml`"
export PATH="/usr/sbin:/usr/local/opt/qt/bin:$PATH"
export JAVA_HOME="/usr/java/jre1.8.0.201"
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

PATH="/home/lstrohm/perl5/bin${PATH:+:${PATH}}"; export PATH;
PERL5LIB="/home/lstrohm/perl5/lib/perl5${PERL5LIB:+:${PERL5LIB}}"; export PERL5LIB;
PERL_LOCAL_LIB_ROOT="/home/lstrohm/perl5${PERL_LOCAL_LIB_ROOT:+:${PERL_LOCAL_LIB_ROOT}}"; export PERL_LOCAL_LIB_ROOT;
PERL_MB_OPT="--install_base \"/home/lstrohm/perl5\""; export PERL_MB_OPT;
PERL_MM_OPT="INSTALL_BASE=/home/lstrohm/perl5"; export PERL_MM_OPT;
export GAM_THREADS=15
eval $(thefuck --alias)

alias gam="/home/lstrohm/bin/gamadv-xtd3/gam"
