# Paths
export PATH=/Users/snicolis/.rvm/bin:/Users/snicolis/.rvm/gems/ruby-2.1.1/bin:/usr/local/bin:/usr/local/sbin:~/bin:/usr/bin:/usr/sbin:/usr/texbin:/bin:/sbin:/opt/X11/bin:/opt/maple13/bin:HOME/Python_modules$PATH
export HOMEBREW_CASK_OPTS="--appdir=/Applications"
export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
export PATH="/Users/snicolis/bin/miniconda2/bin:$PATH"

export MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

# Go
export GOPATH=$HOME/golang
export GOROOT=/usr/local/opt/go/libexec
export PATH=$PATH:$GOPATH/bin
export PATH=$PATH:$GOROOT/bin

# Python
export PYTHONPATH=$PYTHONPATH:/usr/local/lib/python2.7/site-packages:$HOME/Python_modules:$HOME/bin/miniconda2/pkgs/

export PYTHONSTARTUP=$HOME/.pythonstartup

# Ruby

if [[ -s $HOME/.rvm/scripts/rvm ]]; then
  source $HOME/.rvm/scripts/rvm;
fi

# cabal
 export PATH=~/.cabal/bin:$PATH

