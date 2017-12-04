{% extends "../../layouts/default.swig" %}

{% block header %}
	{% set header_h1 = "Profile" %}
	{% set header_small = "" %}
	{% set header_big = "" %}
	{% set header_content = "" %}

	{% include "../../features/header_transparent.swig" %}
{% endblock %}

{% block content %}
	<section class="well well-sm section-border">
		<div class="container">
			<h1 class="text-bold text-center"></h1>
			<div class="row">
				{{ FlashMessages.renderMessages(messages) }}
				<div class="single-product">
					<div class="caption">
						<dl class="info-list offset-5">
							<dt>Name *</dt>
							<dd class="profile-label">{{ userData.name.full|default('-') }}</dd>
							<dt>Institutional Name *</dt>
							<dd class="profile-label">{{ userData.institutionalName|default('-') }}</dd>
							<dt>Email</dt>
							<dd class="profile-label">{{ userData.email|default('-') }}</dd>
							<dt>Phone Numbers *</dt>
							<dd class="profile-label">{{ userData.phones|join(', ')|default('-') }}</dd>
							<dt>Professional Experience</dt>
							<dd class="profile-label">
								{% if userData.professionalExperience %}
									{% for option in professionalExperience %}
										{% if userData.professionalExperience == option.value %}
											{{ option.label }}
											{% if option.extendedBy %}
												{{ userData.customProfessionalExperience }}
											{% endif %}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							<dt>Educational Background</dt>
							<dd class="profile-label">{{ userData.educationalBackground|default('-') }}</dd>
							<dt>Self-accreditation, Other Qualifications and Licenses *</dt>
							<dd class="profile-label">
								{% if userData.selfAccreditation %}
									{% for option in selfAccreditation %}
										{% if userData.selfAccreditation == option.value %}
											{{ option.label }}
											{% if option.extendedBy %}
												{{ userData.customSelfAccreditation }}
											{% endif %}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							</dd>
							<hr/>
							<h5 class="bam-profile-header-small">Broker’s relations</h5>
							<hr/>
							{% if brokers|first %}
							<table class="table table-striped table-mobile mobile-primary">
								<colgroup>
									<col class="col-xs-3">
									<col class="col-xs-3">
									<col class="col-xs-3">
									<col class="col-xs-3">
								</colgroup>
								<thead>
								<tr class="bg-primary">
									<th>Name</th>
									<th>Firm Name</th>
									<th>Address</th>
									<th>Phone</th>
								</tr>
								</thead>
								<tbody>
								{% for broker in brokers %}
									<tr>
										<td>{{ broker.name.full|default('-') }}</td>
										<td>{{ broker.firmName|default('-') }}</td>
										<td>{{ broker.address|default('-') }}</td>
										<td>{{ broker.phone|default('-') }}</td>
									</tr>
								{% endfor %}
								</tbody>
							</table>
							{% else %}
								<h7>You didn't specify any brokers.</h7>
							{% endif %}
							<hr/>
							<h5 class="bam-profile-header-small">Individual Preferences</h5>
							<hr/>

							<dt>Volume of email</dt>
							<dd class="profile-label">
								{% if userData.emailVolume %}
									{% for option in emailVolume %}
										{% if userData.emailVolume == option.value %}
											{{ option.label }}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							</dd>
							<dt>Asset class</dt>
							<dd class="profile-label">
								{% if userData.assetClass %}
									{% for option in assetClass %}
										{% if userData.assetClass == option.value %}
											{{ option.label }}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							</dd>
							{% if userData.assetClass == 'any' || userData.assetClass == 'performing' %}
								<dt>Asset Maturity</dt>
								<dd class="profile-label">{{ userData.assetMaturity|default('-') }}</dd>
							{% endif %}
							{% if userData.assetClass == 'any' || userData.assetClass == 'nonPerforming' %}
								<dt>Length of Arrears</dt>
								<dd class="profile-label">{{ userData.arrearsLength|default('-') }}</dd>
							{% endif %}
							<dt>Sector/Industry Risk</dt>
							<dd class="profile-label">
								{% if userData.riskPreference %}
									{% for option in riskPreference %}
										{% if userData.riskPreference == option.value %}
											{{ option.label }}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							</dd>
							<dt>Collateral Type</dt>
							<dd class="profile-label">
								{% if userData.collateralType %}
									{% for option in collateralType %}
										{% if userData.collateralType == option.value %}
											{{ option.label }}
										{% endif %}
									{% endfor %}
								{% else %}
									-
								{% endif %}
							</dd>
						</dl>
						<div class="row">
							<a href="/profile/edit" class="btn btn-primary btn-sm round-large">Edit Profile</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{% endblock %}

{% block popup %}
	{% if showProfilePopup %}
	<div class="mfp-hide modal-dialog modal-content overlay-def bam-modal-dialog" id="inline_content_modal" style="">
		<header class="modal-header">
			<h6 class="text-center">Send invitations</h6>
		</header>
		<div class="modal-body">
			<div class="bam-flash-message-wrapper">
				{{ FlashMessages.renderMessages(messages) }}
			</div>
			<form class="row label-insets no-margin" method="post">
				<input type="hidden" name="action" value="send_invitation"/>
				{% set numbers = [0,1,2,3,4] %}
				{% for count in numbers %}
					<div class="form-group col-sm-6">
						<input type="text" name="invitation[{{ count }}][name]" placeholder="Name"
							   id="firstName" class="form-control" value="{{ formData.name['full'] | default('') }}">
					</div>
					<div class="form-group col-sm-6">
						<input type="text" name="invitation[{{ count }}][email]" placeholder="Email"
							   id="firstName" class="form-control" value="{{ formData.email | default('') }}">
					</div>
				{% endfor %}
				<div class="col-sm-7 pull-right">
					<button type="submit" class="btn btn-primary no-margin btn-xs round-xl btn-block form-el-offset-1">Send invitations</button>
				</div>
			</form>
		</div>
	</div>
	{% endif %}
{% endblock %}

{% block js %}
	{% if showProfilePopup %}
	<script src="/js/jquery.magnific-popup.min.js"></script>
	<script>
		$(window).load(function () {
			$.magnificPopup.open({
				items: {
					src: '#inline_content_modal',
					type: 'inline'
				},
				callbacks: {
					beforeOpen: function() {
						this.st.focus = '#name';
					}
				}
			}, 0);
		});
	</script>
	{% endif %}
{% endblock %}

{% block footer %}
	{% set footer_class = "page-footer footer-centered text-center" %}
	{% include "../../features/footer_minimal.swig" %}
{% endblock %}
