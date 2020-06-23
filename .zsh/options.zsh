# Options

# Use modern completion system
autoload -Uz compinit
compinit

# use share_history instead of setopt APPEND_HISTORY         # appends history to .zsh_history
setopt AUTO_CD                # cd if no matching command
setopt AUTO_PARAM_SLASH       # adds slash at end of tabbed dirs
setopt CHECK_JOBS             # check bg jobs on exit
setopt CORRECT                # corrects spelling
setopt CORRECT_ALL            # corrects spelling
setopt EXTENDED_GLOB          # globs #, ~ and ^
setopt EXTENDED_HISTORY       # saves timestamps on history
setopt GLOB_DOTS              # find dotfiles easier
setopt HASH_CMDS              # save cmd location to skip PATH lookup
setopt HIST_EXPIRE_DUPS_FIRST # expire duped history first
setopt HIST_NO_STORE          # don't save 'history' cmd in history
setopt INC_APPEND_HISTORY     # append history as command are entered
setopt LIST_ROWS_FIRST        # completion options left-to-right, top-to-bottom
setopt LIST_TYPES             # show file types in list
setopt MARK_DIRS              # adds slash to end of completed dirs
setopt NUMERIC_GLOB_SORT      # sort numerically first, before alpha
setopt PROMPT_SUBST           # sub values in prompt (though it seems to work anyway haha)
setopt RM_STAR_WAIT           # pause before confirming rm *
setopt autonamedirs

HISTFILE=~/.zsh/zhistory
HISTSIZE=SAVEHIST=10000
setopt incappendhistory
setopt sharehistory
setopt extendedhistory

#-- zstyle comletions --#
zstyle ':completion:*' completer _expand _complete _correct _approximate
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}
zstyle ':completion:*:options' description 'yes'
zstyle ':completion:*:options' auto-description '%d'
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path ~/.config/zsh/cache
zstyle ':completion:*:rm:*' ignore-line yes

DISABLE_CORRECTION="true"


# Autojump
#[[ -s $(brew 
#--prefix)/etc/profile.d/autojump.sh ]] && . $(brew --prefix)/etc/profile.d/autojump.sh
