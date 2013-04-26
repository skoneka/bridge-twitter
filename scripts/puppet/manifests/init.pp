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

  $nodeversion = 'v0.8.21'
  $mongodbversion = '2.2.3'



  setup::unpack{'unpack_mechanism_bridge-twitter':
    livedir => $pryv::livedir,
    app     => $app,
  }

  # dependencies
  class {'nodesetup': nodeversion => $nodeversion}
  class {'mongodb': mongodbversion => $mongodbversion}


  if ($environment == "staging") {
     secret::ssl{"rec.la": }
     $httpcerts = "${pryv::livedir}/secret/rec.la"
     $staging = true
  } else {
     secret::ssl{"pryv.io": }
     $httpcerts = "${pryv::livedir}/secret/pryv.io"
     $staging = false
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

  file { 'upstart':
    ensure  => 'file',
    path    => '/etc/init/bridge-twitter.conf',
    content => template('head/upstart-default-nodeapp-minimal-watch-no-config.conf.erb'),
    mode    => '0644',
    require => Exec['supervisor'],
  }
}
