# this is Engine Yard specific file to preserve config among redeploys
# link env file
run "rm -rf #{config.release_path}/.env"
run "ln -nfs #{config.shared_path}/.env #{config.release_path}/.env"

