# environment should be "staging" or "production"
class bridge-twitter($httpport,$twitterKey,$twitterSecret) {

  $environment = $pryv::environment
  notify {"Bridge-twitter server module in ${environment}":}

  # init module vars

  $app = 'bridge-twitter-server'
  $appcode = $app
  $appdir = "${pryv::livedir}/${app}"
  $filesdir = "${pryv::datadir}/${app}-files"
  $logsdir = $pryv::logsdir
  $configdest = "${appdir}.config.json"


  setup::unpack{'unpack_mechanism_bridge-twitter':
    livedir => $pryv::livedir,
    app     => $app,
  }

  file { $appdir:
    ensure  => 'directory',
    mode    => '0644',
    require => File[$pryv::livedir],
  }

  file {"bridge twitter config file":
    path    =>  $configdest,
    ensure  => 'file',
    mode    => '0644',
    content  => template("bridge-twitter/config.erb"),
    require => File["${pryv::livedir}"],
  }

  file {"bridge-twitter setup script":
    path    =>  "$appdir.setup.bash",
    ensure  => 'file',
    content => template("bridge-twitter/setup-app.erb"),
    mode    => '755',
    require => File["$appdir"],
  }

  file { 'bridge-twitter upstart':
    ensure  => 'file',
    path    => '/etc/init/bridge-twitter.conf',
    content => template('head/upstart-default-nodeapp-minimal-watch.conf.erb'),
    mode    => '0644',
    require => Exec['supervisor'],
  }
}
