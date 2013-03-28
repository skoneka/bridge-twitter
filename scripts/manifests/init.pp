# environment should be "staging" or "production"
class bridge-twitter($environment = 'production') {

  notify {"Bridge-twitter server module in '${environment}'":}

  # init module vars

  $app = 'bridge-twitter-server'
  $appcode = $app # used by upstart config template, TODO: refactor to just use $app (useless)
  $appunpack = $environment ? { # haven't found how to do string concat to factor out the "livedir" bit
    'staging' => "staging-${app}",
    default => "$app",
  }
  $appdir = "${::livedir}/${appunpack}"
  $filesdir = "${::datadir}/${app}-files"
  $logsdir = $::logsdir
  $configdest = "${appdir}.config.json"

  $nodeversion = 'v0.8.21'
  $mongodbversion = '2.2.3'

  setup::unpack{'unpack_mechanism_bridge-twitter':
    livedir => $::livedir,
    app     => $appunpack,
  }

  # dependencies
  class {'nodesetup': nodeversion => $nodeversion}
  class {'mongodb': mongodbversion => $mongodbversion}

  file { $appdir:
    ensure  => 'directory',
    mode    => '0644',
    require => File[$::livedir],
  }

  file { 'app config file':
    ensure  => 'file',
    path    => $configdest,
    mode    => '0644',
    content => template("bridge-twitter/config.${environment}.json.erb"),
    require => File[$appdir],
  }

  file { 'upstart':
    ensure  => 'file',
    path    => '/etc/init/bridge-twitter.conf',
    content => template('head/upstart-default-nodeapp-minimal-watch.conf.erb'),
    mode    => '0644',
    require => [Exec['supervisor'], File['app config file']],
  }

}